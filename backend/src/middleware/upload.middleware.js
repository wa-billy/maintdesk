import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { ERROR, UPLOAD } from '../../constants.js';
import { AppError } from '../utils/http.js';

export const upload = multer({
  storage: multer.diskStorage({
    destination: env.upload,
    filename: (req, file, cb) => cb(null, randomUUID + UPLOAD.TYPES[file.mimetype]),
  }),
  limits: { fileSize: UPLOAD.MAX_BYTES, files: UPLOAD.MAX_FILE },
  fileFilter: (req, file, cb) =>
    UPLOAD.TYPES[file.mimetype]
      ? cb(null, true)
      : cb(new AppError(...ERROR.INVALID('file')))
});