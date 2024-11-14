

import express from 'express';
import routes from './routes/index.js';

const app = express();
const port = 5000;
app.use(express.json())


routes(app);

app.listen(port);


export default app;
