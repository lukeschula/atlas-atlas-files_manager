// Implement authentication method with token generation and Redis caching
import redisClient from "../utils/redis.js";
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db.js';

class AuthController {

  static async getConnect(req, res) {
    try {

      const authHeader = req.headers.authorization;


      if (!authHeader) {
        return res.status(401).send({ error: 'Unauthorized.  Please provide an authorization header.' });
      }


      const [, encodedUserData] = authHeader.split(' ');


      const decodedUserData = Buffer.from(encodedUserData, 'base64').toString('ascii');
      const [userEmail, userPassword] = decodedUserData.split(':');

      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ email: userEmail });


      if (!existingUser) {
        return res.status(401).send({ error: 'Unauthorized.' });
      }

      const hashedPassword = crypto.createHash('sha1').update(userPassword).digest('hex');


      if (existingUser.password !== hashedPassword) {
        return res.status(401).send({ error: 'Unauthorized.' });
      }


      const token = uuidv4();
      const fullToken = `auth_${token}`;
      const existingUserId = existingUser._id.toString();
      const timeInSeconds = 24 * 60 * 60

      await redisClient.set(fullToken, existingUserId, timeInSeconds);

      return res.status(200).send({token});

    } catch (err) {
      console.error(err);
    }
  }



static async getDisconnect(req, res) {

    const token = req.headers['x-token'];


    if (!token) {
      return res.status(401).send({ error: 'Unauthorized. No Token Provided' });
    }


    try {

      const fullToken = `auth_${token}`;
      const existingToken = await redisClient.get(fullToken);


      if (!existingToken) {
        return res.status(401).send({ error: 'Unauthorized. No Token Found' });
      }


      await redisClient.del(fullToken);

      return res.status(204).send();
    } catch (err) {
      console.error(err);
    }
  }
}


export default AuthController;
