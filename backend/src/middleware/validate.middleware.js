import { body, validationResult } from 'express-validator'
import { AppError } from '../utils/http.js';
import { ERROR } from '../../constants.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  throw new AppError(...ERROR.INVALID('data'));
}

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Please enter username'),
  body('password').notEmpty().withMessage('Please enter password')
];