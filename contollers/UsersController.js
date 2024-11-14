// User creation with email and password validation

import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import crypto from 'crypto';
import { ObjectID } from 'mongodb';

class UsersController {

  static async postNew(req, res) {

    try {
      const userDocs = await dbClient.db.collection('users');

      const userEmail = req.body.email;
      const userPassword = req.body.password;


      if (!userEmail) {
        return res.status(400).send({ error: "Missing email" });
      }


      if (!userPassword) {
        return res.status(400).send({ error: "Missing password" });
      }

      const hashedPassword = crypto.createHash('sha1').update(userPassword).digest('hex');
      const newDocument = { email: userEmail, password: hashedPassword };

      const existingRecord = await userDocs.findOne({ email: userEmail });

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
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).send({ error: 'Unauthorized. No Token Provided' });
    }


    try {
      const fullToken = `auth_${token}`;
      const userId = await redisClient.get(fullToken);


      if (!userId) {
        return res.status(401).send({ error: 'Unauthorized: No Token Found' });
      }

      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });

      if (!existingUser) {
        return res.status(401).send({ error: 'Unauthorized: No User Found' });
      }

      const responseObject = { id: existingUser._id, email: existingUser.email };

      return res.status(200).send(responseObject);
    } catch (err) {
      console.error(err);
    }
  }
}

export default UsersController;
