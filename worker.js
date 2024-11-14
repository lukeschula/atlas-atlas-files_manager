// Integrated Bull queue (`my-file-queue`) to handle thumbnail generation for files.
// Process job checks for required parameters (fileId, userId) and retrieves file from MongoDB.
//Generates multiple thumbnails of different sizes (100px, 250px, 500px) using the `image-thumbnail` package.
//Saves generated thumbnails to the file system with different output paths.
//Added error handling for missing parameters, file not found, and processing failures.

import Queue from 'bull';
import { thumbnail } from 'image-thumbnail';
import dbClient from './utils/db.js';
import fs from 'fs';

const fileQueue = new Queue('my-file-queue');

fileQueue.process(async (job) => {
  try {
    if (!fileId) {
      throw new Error('Missing FileId');
    }
    if (!userId) {
      throw new Error('Missing userId');
    }
    const fileDocs = dbClient.db.collection('files');
    const existingFile = await fileDocs.fineOne({ _id: job.data.fileId, userId: job.data.userId });

    if (!existingFile) {
      throw new Error('File not found');
    }

    const widths = [100, 250, 500]
    const outputPaths = [
      `${existingFile.localPath}_${widths[0]}`,
      `${existingFile.localPath}_${widths[1]}`,
      `${existingFile.localPath}_${widths[2]}`
    ]

    const options = widths.map(width => ({ width }));
    const thumbs = await Promise.all(options.map(opt => thumbnail(existingFile.localPath, opt)));

    await Promise.all(thumbs.map((thumb, index) => fs.writeFile(outputPaths[index], thumb)));
  } catch (err) {
    throw new Error('Process Failed');
  }
});

export default fileQueue;
