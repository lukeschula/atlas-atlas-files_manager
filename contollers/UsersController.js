// User creation with email and password validation

import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import crypto from 'crypto';
import { ObjectID } from 'mongodb';

class UsersController {

  static async postNew(req, res) {
    // Posts new user to Mongo Database
    try {
      const userDocs = await dbClient.db.collection('users');

      const userEmail = req.body.email;
      const userPassword = req.body.password;

      // Email is missing: 400
      if (!userEmail) {
        return res.status(400).send({ error: "Missing email" });
      }

      // Password is missing: 400
      if (!userPassword) {
        return res.status(400).send({ error: "Missing password" });
      }

      // Hashing Password
      const hashedPassword = crypto.createHash('sha1').update(userPassword).digest('hex');
      const newDocument = { email: userEmail, password: hashedPassword };

      // Returns null when no record is found
      const existingRecord = await userDocs.findOne({ email: userEmail });

      // User already exists: 400
      if (existingRecord !== null) {
        return res.status(400).send({ error: "Already exists" });
      }

      const result = await userDocs.insertOne(newDocument);
      const dataToSend = { id: result.insertedId, email: userEmail };

      return res.status(201).send(dataToSend);
    } catch (err) {
      console.error(err);
    }
  }

  static async getMe(req, res) {
    // Retrieves user based on Auth Token
    const token = req.headers['x-token'];

    // No token provided: 401
    if (!token) {
      return res.status(401).send({ error: 'Unauthorized. No Token Provided' });
    }

    // Retrieve User Based on Provided Auth Token
    try {
      // Wait for Redis to return existing token
      const fullToken = `auth_${token}`;
      const userId = await redisClient.get(fullToken);

      // No token found: 401
      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized: No Token Found' });
      }

      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });

      // No User found: 401
      if (!existingUser) {
        return res.status(401).send({ error: 'Unauthorized: No User Found' });
      }

      // Response to send if User found
      const responseObject = { id: existingUser._id, email: existingUser.email };

      // Response from server
      return res.status(200).send(responseObject);
    } catch (err) {
      console.error(err);
    }
  }
}

// Export
export default UsersController;
