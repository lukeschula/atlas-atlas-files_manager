// File upload functionality with user authentication and validation

import redisClient from '../utils/redis.js'
import dbClient from '../utils/db.js';
import { ObjectID } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import fileQueue from '../worker.js';

class FilesController {

  static async postUpload(req, res) {



    let userId, fileName, fileType, fileData, filePath, newFileObject, newFolderObject;

    try {
      const token = req.headers['x-token'];


      const fullToken = `auth_${token}`;
      userId = await redisClient.get(fullToken);

      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });


      if (!existingUser) {
        throw err;
      }

    } catch (err) {
      return res.status(401).send({ error: 'Unauthorized' });
    }


    try {

      if (!req.body.name) {
        return res.status(400).send({ error: 'Missing name' });
      } else {
        fileName = req.body.name;
      }


      const acceptedTypes = ['file', 'folder', 'image'];
      if (!req.body.type || !acceptedTypes.includes(req.body.type)) {
        return res.status(400).send({ error: 'Missing type' });
      } else {
        fileType = req.body.type;
      }


      if (!req.body.data && fileType !== 'folder') {
        return res.status(400).send({ error: 'Missing data' });
      } else if (fileType === 'file' || fileType === 'image') {
        fileData = req.body.data;
      }


      let parentId = 0;
      let isPublic = false;


      if (req.body.parentId) {
        parentId = req.body.parentId;


        const fileDocs = dbClient.db.collection('files');
        const existingFile = await fileDocs.findOne({ _id: new ObjectID(parentId) });

        if (existingFile) {
          if (existingFile.type !== 'folder') {
            return res.status(400).send({ error: 'Parent is not a folder' });
          }
        } else {
          return res.status(400).send({ error: 'Parent not found' });
        }
      }

      if (req.body.isPublic) {
        isPublic = req.body.isPublic;
      }


      filePath = process.env.FOLDER_PATH;


      if (!filePath) {
        filePath = '/tmp/files_manager';
      }


      newFileObject = {
        userId: ObjectID(userId),
        name: fileName,
        type: fileType,
        isPublic: isPublic,
        parentId: ObjectID(parentId),
        localPath: filePath
      };

      newFolderObject = {
        userId: ObjectID(userId),
        name: fileName,
        type: fileType,
        isPublic: isPublic,
        parentId: ObjectID(parentId),
      };

    } catch (err) {
      return res.status(400).send({ error: 'New File Object not Created '});
    }


    try {
        const fileDocs = dbClient.db.collection('files');

        if (fileType === 'folder') {
          const result = await fileDocs.insertOne(newFolderObject);
          newFolderObject._id = result.insertedId;
          return res.status(201).send(newFolderObject);
        }


        const decodedFileData = Buffer.from(fileData, 'base64').toString('ascii');
        const finalPath = `${filePath}/${uuidv4()}`;
        newFileObject.localPath = finalPath;

        const result = await fileDocs.insertOne(newFileObject);
        newFileObject._id = result.insertedId;


        fs.mkdir(filePath, { recursive: true }, (err) => {
          if (err) {
            console.error(err);
          }
        });

        fs.writeFile(finalPath, decodedFileData, err => {
          if (err) {
            console.error(err);
          } else {
            console.log('File created successfully');
          }
        });

        fileQueue.add({
          fileId: newFileObject._id,
          userId: userId
        });


        return res.status(201).send(newFileObject);
      } catch (err) {
        console.error(err);
        return res.status(400).send({ error: 'File upload failed' });
      }
    }

  static async getShow(req, res) {

    let userId;

    try {
      const token = req.headers['x-token'];


      const fullToken = `auth_${token}`;
      userId = await redisClient.get(fullToken);

      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });

      if (!existingUser) {
        throw err;
      }
    } catch (err) {
      console.error(err);
      return res.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const fileId = req.params.id;
      console.log(`File ID param from Curl: ${fileId}`);
      const fileDocs = dbClient.db.collection('files');
      const existingFile = await fileDocs.findOne({ _id: ObjectID(fileId), userId: ObjectID(userId) });

      if (!existingFile) {
        throw new Error('Not found');
      }
      return res.status(200).send(existingFile);
    } catch (err) {
      console.error(err);
      return res.status(404).send({ error: 'Not found' });
    }
  }

   static async getIndex(req, res) {

    let userId;

    try {
      const token = req.headers['x-token'];

      const fullToken = `auth_${token}`;
      userId = await redisClient.get(fullToken);

      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });

      if (!existingUser) {
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(401).send({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page) || 0;
    const pageSize = 20;
    const skip = page * pageSize;

    try {
      const userFiles = dbClient.db.collection('files');
      const parentId = req.query.parentId;

      let query = { userId: new ObjectID(userId) }


      if (parentId) {
        query.parentId = new ObjectID(parentId);

        const filesWithParent = await userFiles.findOne({ userId: new ObjectID(userId), parentId: new ObjectID(parentId) });

        if (!filesWithParent) {
          return res.status(200).send([]);
        }
      }

       const aggregateQuery = [
        { $match: query },
        { $skip: skip },
        { $limit: pageSize }
      ];

      const allFiles = await userFiles.aggregate(aggregateQuery).toArray();
      return res.status(200).send(allFiles);
    } catch (err) {
      console.error(err);
    }
  }


  static async putPublish(req, res) {

    let userId;


    try {
      const token = req.headers['x-token'];


      const fullToken = `auth_${token}`;
      userId = await redisClient.get(fullToken);


      const userDocs = dbClient.db.collection('users');
      const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });

      if (!existingUser) {
        throw err;
      }
    } catch (err) {
      console.error(err);
      res.status(401).send({ error: 'Unauthorized' });
    }
    try {
        const fileId = req.params.id;
        const fileDocs = dbClient.db.collection('files');
        const existingFile = await fileDocs.findOne({ _id: ObjectID(fileId), userId: ObjectID(userId) });

        if (!existingFile) {
          throw err;
        }

        fileDocs.updateOne({ _id: ObjectID(fileId) }, { $set: { isPublic: true } });
        const updatedFile = await fileDocs.findOne({ _id: ObjectID(fileId) });

        return res.status(200).send(updatedFile);

      } catch (err) {
        console.error(err)
        res.status(404).send({ error: 'Not found' });
      }
    }

    static async putUnpublish(req, res) {

      let userId;

      try {
        const token = req.headers['x-token'];


        const fullToken = `auth_${token}`;
        userId = await redisClient.get(fullToken);


        const userDocs = dbClient.db.collection('users');
        const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });


        if (!existingUser) {
          throw err;
        }
      } catch (err) {
        console.error(err);
        res.status(401).send({ error: 'Unauthorized' });
      }


      try {


        const fileId = req.params.id;
        const fileDocs = dbClient.db.collection('files');
        const existingFile = await fileDocs.findOne({ _id: ObjectID(fileId), userId: ObjectID(userId) });


        if (!existingFile) {
          throw err;
        }


        fileDocs.updateOne({ _id: ObjectID(fileId) }, { $set: { isPublic: false } });
        const updatedFile = await fileDocs.findOne({ _id: ObjectID(fileId) });


        return res.status(200).send(updatedFile);

      } catch (err) {
        console.error(err)
        res.status(404).send({ error: 'Not found' });
      }
    }


    static async getFile(req, res) {

      let userId;


      try {
        const token = req.headers['x-token'];


        const fullToken = `auth_${token}`;
        userId = await redisClient.get(fullToken);


        const userDocs = dbClient.db.collection('users');
        const existingUser = await userDocs.findOne({ _id: ObjectID(userId) });


        if (!existingUser) {
          throw err;
        }
      } catch (err) {
        console.error(err);
        res.status(404).send({ error: 'Not found' });
      }


      try {

        const fileID = req.params.id;


        const fileDocs = dbClient.db.collection('files');
        const existingFile = await fileDocs.findOne({ _id: ObjectID(fileID), userId: ObjectID(userId) });

        if (!existingFile) {
          throw new Error();
        }


        if (existingFile.type === 'folder') {
          return res.status(400).send('A folder doesn\'t have content');
        }

        const fileOwner = existingFile.userId.toString();

        if (existingFile.isPublic === false && fileOwner !== userId) {
          throw new Error('This error?');
        }

        if (!fs.existsSync(existingFile.localPath)) {
          throw new Error();
        }


        const mimeType = mime.lookup(existingFile.name);
        const charSet = mime.charset(mimeType);
        const fileData = fs.readFileSync(existingFile.localPath, charSet, (err, data) => {
          if (err) {
            console.error(err);
          } else {
            console.log('file read successfully');
            return data;
          }
        });


        res.setHeader('content-type', mimeType);
        return res.status(200).send(fileData);

      } catch (err) {
        console.error(err)
        res.status(404).send({ error: 'Not found' });
      }
    }
  }


  export default FilesController;




