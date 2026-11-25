import express from 'express';
import router from './routers/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { initDb } from './config/db.js'

export const app = express();

await initDb();
app.use(express.json());
app.use('/api/uploads', express.static(process.env.UPLOAD_DIR || 'uploads'));
app.use('/api', router);
app.use(notFound);
app.use(errorHandler);
