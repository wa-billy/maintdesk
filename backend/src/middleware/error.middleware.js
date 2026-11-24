import fs from 'node:fs/promises';
import { PG_ERROR } from '../../constants.js';
import multer from 'multer';

export const notFound = (req, res) => {
  res.status(404).json({ status: 'error', message: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  const uploaded = req.files ?? (req.file ? [req.file] : []);
  uploaded.forEach((f) => fs.unlink(f.path).catch(() => {}));

  let { status = 500, message } = err;
  if (PG_ERROR[err.code]) [message, status] = PG_ERROR[err.code];
  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = status === 413 ? 'File size more than 5m' : 'Invalid file'
  }
  if (status >= 500) {
    console.log(err);
    message = 'Something went wrong';
  }

  res.status(status).json({ status: 'error', message, ...(err.errors && { errors: err.errors } ) });
}