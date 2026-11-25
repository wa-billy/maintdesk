import { Router } from 'express';
import { body } from 'express-validator';
import { pool } from '../../config/db.js';
import { assign } from '../../controllers/admin/tickets.controller.js';
import { validate } from '../../middleware/validate.middleware.js';

const ticketsRoute = Router();

ticketsRoute.patch('/:id/assign',
  body('technician_id').isUUID().withMessage('กรุณาเลือกช่าง').bail()
    .custom(async (id) => {
      const { rowCount } = await pool.query(
        `SELECT 1 FROM users WHERE id = $1 AND role = 'technician' AND is_active`, [id]);
      if (!rowCount) throw new Error('ไม่ใช่ช่าง หรือบัญชีถูกปิด');
    }),
  validate,
  assign,
);

export default ticketsRoute;
