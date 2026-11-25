import { Router } from 'express';
import { body } from 'express-validator';
import { login, me } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const authRoute = Router();

authRoute.post('/login',
  body('username').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้'),
  body('password', 'กรุณากรอกรหัสผ่าน').isString().bail().notEmpty(),
  validate,
  login,
);
authRoute.get('/me', authenticate, me);

export default authRoute;
