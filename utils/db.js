// Connecting to MongoDB

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://michaeluser:1Ut55gpPyQ84FxZ0@files-manager-cluster.rqhsejc.mongodb.net/?retryWrites=true&w=majority&appName=Files-Manager-Cluster";

class DBClient {
  constructor() {

    this.database = 'files_manager';
    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.client.connect((err) => {
      if (err) {
        console.err('Failed to connect to MongoDB', err);
        return;
      }
      console.log('Connected to MongoDB');
      this.db = this.client.db(this.database);
    });
  }


  isAlive() {
    try {

      this.client.connect();
      console.log("Successfully pinged.");
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async nbUsers() {
    const userDocs = this.db.collection('users');
    const userDocCount = userDocs.countDocuments();
    return userDocCount;
  }


  async nbFiles() {
    const fileDocs = this.db.collection('files');
    const fileDocCount = fileDocs.countDocuments();
    return fileDocCount;
  }
}


const dbClient = new DBClient();
module.exports = dbClient;
