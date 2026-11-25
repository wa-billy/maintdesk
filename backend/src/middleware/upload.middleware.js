import multer from 'multer';
import { randomUUID } from 'node:crypto';

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' };
const ALLOWED = {
  report_attachment: ['image/jpeg', 'image/png', 'application/pdf'],
  repair_image: ['image/jpeg', 'image/png'],
  image: ['image/jpeg', 'image/png'],
};

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || 'uploads',
  filename: (req, file, cb) => cb(null, randomUUID() + EXT[file.mimetype]),
});

export const upload = (field) => multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => ALLOWED[field].includes(file.mimetype)
    ? cb(null, true)
    : cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname)),
}).single(field);
