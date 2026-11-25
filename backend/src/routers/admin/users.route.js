import { Router } from 'express';
import { body, query } from 'express-validator';
import { list, get, create, update, changePassword, setActive, remove } from '../../controllers/admin/users.controller.js';
import { validate } from '../../middleware/validate.middleware.js';

const usersRoute = Router();
const falsy = { values: 'falsy' };
const ROLES = ['admin', 'technician', 'reporter'];

const password = body('password', 'รหัสผ่านต้องเป็นข้อความอย่างน้อย 8 ตัวอักษร').isString().bail().isLength({ min: 8 });
const fullName = body('full_name').trim().notEmpty().withMessage('กรุณากรอกชื่อ-นามสกุล')
  .isLength({ max: 100 }).withMessage('ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร');
const role = body('role').isIn(ROLES).withMessage('role ไม่ถูกต้อง');

usersRoute.get('/',
  query('q').optional(falsy).trim(),
  query('role').optional(falsy).isIn(ROLES).withMessage('role ไม่ถูกต้อง'),
  query('is_active').optional(falsy).isBoolean().withMessage('is_active ต้องเป็น true หรือ false').toBoolean(),
  query('page').optional(falsy).isInt({ min: 1 }).withMessage('page ต้องเป็นจำนวนเต็มตั้งแต่ 1').toInt(),
  query('limit').optional(falsy).isInt({ min: 1, max: 50 }).withMessage('limit ต้องอยู่ระหว่าง 1–50').toInt(),
  validate,
  list,
);
usersRoute.get('/:id', get);
usersRoute.post('/',
  body('username').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้')
    .isLength({ max: 50 }).withMessage('ชื่อผู้ใช้ต้องไม่เกิน 50 ตัวอักษร'),
  password, fullName, role, validate,
  create,
);
usersRoute.put('/:id', fullName, role, validate, update);
usersRoute.patch('/:id/password', password, validate, changePassword);
usersRoute.patch('/:id/active',
  body('is_active').isBoolean().withMessage('is_active ต้องเป็น true หรือ false').toBoolean(),
  validate,
  setActive,
);
usersRoute.delete('/:id', remove);

export default usersRoute;
