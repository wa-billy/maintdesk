import { validationResult } from 'express-validator';
import { AppError } from '../utils/http.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  throw new AppError('ข้อมูลไม่ถูกต้อง', 422, errors);
}
