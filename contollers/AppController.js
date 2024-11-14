// Implement status check for Redis and Database connectivity
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

class AppController {


  // Checks if Redis/DB are active
  static async getStatus(req, res) {
    // Connect to both Redis and DB concurrently
    const redisStatus = await redisClient.isAlive();
    const dbStatus = await dbClient.isAlive();

    // Return correct response based on db status
    if (redisStatus && dbStatus) {
      res.status(200).send({ "redis": true, "db": true });
    } else if (!redisStatus && dbStatus) {
      res.status(503).send('Redis Not Connected');
    } else if (redisStatus && !dbStatus) {
      res.status(503).send('Database Not Connected');
    } else {
      res.status(503).send('Unknown Database Error');
    }
  }

  // Add controller method to retrieve user and file statistics
  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    res.status(200).send({ "users": users, "files": files })
  }
}

// Export
export default AppController;