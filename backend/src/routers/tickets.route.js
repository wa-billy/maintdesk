import { Router } from 'express';
import { body, query } from 'express-validator';
import { pool } from '../config/db.js';
import { list, get, create, update, remove, changeStatus, repairImage } from '../controllers/tickets.controller.js';
import { authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const ticketsRoute = Router();
const falsy = { values: 'falsy' };

const listRules = [
  query('q').optional(falsy).trim(),
  query('status').optional(falsy)
    .isIn(['new', 'assigned', 'in_progress', 'done', 'cancelled']).withMessage('สถานะไม่ถูกต้อง'),
  query('category_id').optional(falsy).isUUID().withMessage('หมวดหมู่ไม่ถูกต้อง'),
  query('page').optional(falsy).isInt({ min: 1 }).withMessage('page ต้องเป็นจำนวนเต็มตั้งแต่ 1').toInt(),
  query('limit').optional(falsy).isInt({ min: 1, max: 50 }).withMessage('limit ต้องอยู่ระหว่าง 1–50').toInt(),
  validate,
];

const ticketRules = [
  upload('report_attachment'),
  body('title').trim().notEmpty().withMessage('กรุณากรอกหัวข้อ')
    .isLength({ max: 150 }).withMessage('หัวข้อต้องไม่เกิน 150 ตัวอักษร'),
  body('category_id').isUUID().withMessage('กรุณาเลือกหมวดหมู่').bail()
    .custom(async (id) => {
      const { rowCount } = await pool.query('SELECT 1 FROM categories WHERE id = $1', [id]);
      if (!rowCount) throw new Error('ไม่พบหมวดหมู่นี้');
    }),
  body('location').trim().notEmpty().withMessage('กรุณากรอกสถานที่')
    .isLength({ max: 100 }).withMessage('สถานที่ต้องไม่เกิน 100 ตัวอักษร'),
  body('description').trim().notEmpty().withMessage('กรุณากรอกรายละเอียด'),
  validate,
];

ticketsRoute.get('/', listRules, list);
ticketsRoute.get('/:id', get);
ticketsRoute.post('/', authorize('reporter'), ticketRules, create);
ticketsRoute.put('/:id', authorize('reporter'), ticketRules, update);
ticketsRoute.delete('/:id', authorize('reporter'), remove);
ticketsRoute.patch('/:id/status',
  body('status').isIn(['in_progress', 'done', 'cancelled']).withMessage('สถานะต้องเป็น in_progress, done หรือ cancelled'),
  body('note').optional({ values: 'null' }).isString().withMessage('หมายเหตุต้องเป็นข้อความ').trim(),
  body('repair_cost').optional({ values: 'null' }).isFloat({ min: 0, max: 99999999.99 })
    .withMessage('ค่าซ่อมต้องเป็นตัวเลขตั้งแต่ 0 ถึง 99,999,999.99'),
  validate,
  changeStatus,
);
ticketsRoute.put('/:id/repair-image', authorize('technician'), upload('repair_image'), repairImage);

export default ticketsRoute;
