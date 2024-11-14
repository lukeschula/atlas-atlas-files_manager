// Defined Routes for Controllers
import AppController from '../controllers/AppController.js';
import UsersController from '../controllers/UsersController.js';
import AuthController from '../controllers/AuthController.js';
import FilesController from '../controllers/FilesController.js';

// Routes Object
const routes = (app) => {

  app.get('/status', AppController.getStatus);


  app.get('/stats', AppController.getStats);


  app.get('/connect', AuthController.getConnect);


  app.get('/disconnect', AuthController.getDisconnect);


  app.get('/users/me', UsersController.getMe);


  app.post('/users', UsersController.postNew);

  app.post('/files', FilesController.postUpload);


  app.get('/files', FilesController.getIndex);


  app.get('/files/:id', FilesController.getShow);


  app.get('/files/:id/data', FilesController.getFile);


  app.put('/files/:id/publish', FilesController.putPublish);


  app.put('/files/:id/unpublish', FilesController.putUnpublish);
};


export default routes;
