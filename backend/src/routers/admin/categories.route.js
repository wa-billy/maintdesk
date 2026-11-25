import { Router } from 'express';
import { body } from 'express-validator';
import { create, update, remove } from '../../controllers/admin/categories.controller.js';
import { upload } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';

const categoriesRoute = Router();

const rules = [
  upload('image'),
  body('name').trim().notEmpty().withMessage('กรุณากรอกชื่อหมวดหมู่')
    .isLength({ max: 50 }).withMessage('ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร'),
  validate,
];

categoriesRoute.post('/', rules, create);
categoriesRoute.put('/:id', rules, update);
categoriesRoute.delete('/:id', remove);

export default categoriesRoute;
