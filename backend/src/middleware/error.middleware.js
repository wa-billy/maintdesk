import fs from 'node:fs/promises';
import multer from 'multer';
import { AppError } from '../utils/http.js';

const PG_ERRORS = {
  23505: [409, 'ข้อมูลนี้มีอยู่แล้ว'],
  23503: [409, 'ข้อมูลถูกอ้างถึงอยู่ หรืออ้างถึงข้อมูลที่ไม่มีอยู่'],
  23001: [409, 'ข้อมูลนี้ยังถูกใช้งานอยู่ จึงลบไม่ได้'],
  '22P02': [400, 'รูปแบบข้อมูลไม่ถูกต้อง'],
  22003: [400, 'ค่าตัวเลขเกินขอบเขต'],
};

export const notFound = (req, res) => res.status(404).json({ status: 'error', message: 'ไม่พบ API ที่เรียก' });

export function errorHandler(err, req, res, next) {
  [req.file, ...Object.values(req.files ?? {}).flat()].forEach((f) => f && fs.unlink(f.path).catch(() => {}));

  let status = 500;
  let message = 'เกิดข้อผิดพลาดในระบบ';
  let errors;
  if (err instanceof AppError) [status, message, errors] = [err.status, err.message, err.errors];
  else if (err instanceof multer.MulterError) {
    [status, message] = err.code === 'LIMIT_FILE_SIZE' ? [413, 'ไฟล์มีขนาดเกินกำหนด'] : [415, 'ชนิดไฟล์ไม่อนุญาต'];
  }
  else if (PG_ERRORS[err.code]) [status, message] = PG_ERRORS[err.code];
  else if (err.type === 'entity.parse.failed') [status, message] = [400, 'รูปแบบข้อมูลไม่ถูกต้อง'];
  else if (err.type === 'entity.too.large') [status, message] = [413, 'ข้อมูลมีขนาดเกินกำหนด'];
  else console.error(err);

  res.status(status).json({ status: 'error', message, ...(errors && { errors }) });
}
