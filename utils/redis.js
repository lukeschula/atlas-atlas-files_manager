// Contains Redis Client

import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {

    this.client = redis.createClient();


    this.client.on('connect', () => {
      this.isReady = true;
      console.log('Successfully connected to the client! :)');
    });


    this.client.on('error', () => {
      console.log('Could not connect to the client. :(');
    });


    this.connectPromise = new Promise((resolve, reject) => {
      this.client.on('ready', () => {resolve()});
      this.client.on('error', () => {reject()});
    })

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }


  async isAlive() {
    try {
      await this.connectPromise;
      return true;
    } catch (err) {
      return false;
    }
  }


  async get(key) {
    try {
      await this.connectPromise;
      const value = await this.getAsync(key);

      return value !== null ? value : null;
    } catch (err) {
      console.error('Could not GET value:', err);
      return null;
    }
  };


  async set(key, value, time) {
    try {
      await this.connectPromise;
      await this.setAsync(key, value, 'EX', time);
    } catch (err) {
      console.error('Could not SET value:', err);
    }
  };


  async del(key) {
    try {
      await this.connectPromise;
      await this.delAsync(key);
    } catch (err) {
      console.error('Could not delete key', err);
    }
  };
}


const redisClient = new RedisClient();
export default redisClient;
