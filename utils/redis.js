// Contains Redis Client

import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // Create Client
    this.client = redis.createClient();

    // Display on Connection
    this.client.on('connect', () => {
      this.isReady = true;
      console.log('Successfully connected to the client! :)');
    });

    //  Display on Error
    this.client.on('error', () => {
      console.log('Could not connect to the client. :(');
    });

    // Return a promise for connection
    this.connectPromise = new Promise((resolve, reject) => {
      this.client.on('ready', () => {resolve()});
      this.client.on('error', () => {reject()});
    })

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // Returns True
  async isAlive() {
    try {
      await this.connectPromise;
      return true;
    } catch (err) {
      return false;
    }
  }

  // Returns the Value of a Key Stored in Redis
  async get(key) {
    try {
      await this.connectPromise;
      const value = await this.getAsync(key);
      // If value isn't null, return value, else null.
      return value !== null ? value : null;
    } catch (err) {
      console.error('Could not GET value:', err);
      return null;
    }
  };

  // Stores Key: Value Pairs and Their Experations
  async set(key, value, time) {
    try {
      await this.connectPromise;
      await this.setAsync(key, value, 'EX', time);
    } catch (err) {
      console.error('Could not SET value:', err);
    }
  };

  // Deletes a Key: Value Pair
  async del(key) {
    try {
      await this.connectPromise;
      await this.delAsync(key);
    } catch (err) {
      console.error('Could not delete key', err);
    }
  };
}

// Export
const redisClient = new RedisClient();
export default redisClient;
