import express from 'express';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import router from './routers/index.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

export const app = express();

app.set('trust proxy', 'loopback', 'uniquelocal');
app.use(express.json());
app.use('/api/uploads', express.static(env.upload));

app.get('/api/health', async (req, res) => {
  await pool.query('SELECT 1');
  ok(res, { db: 'ok' })
});

app.use('/api', router);
app.use(notFound);
app.use(errorHandler);