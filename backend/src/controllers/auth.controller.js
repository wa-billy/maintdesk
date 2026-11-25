import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { AppError, ok } from '../utils/http.js';

export async function login(req, res) {
  const { username, password } = req.body;
  const { rows: [user] } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401);
  }
  if (!user.is_active) throw new AppError('บัญชีถูกปิดใช้งาน', 403);

  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  const { id, full_name, role } = user;
  ok(res, { token, user: { id, username, full_name, role } }, 'เข้าสู่ระบบสำเร็จ');
}

export async function me(req, res) {
  const { rows: [user] } = await pool.query(
    'SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = $1',
    [req.user.id],
  );
  if (!user) throw new AppError('ไม่พบผู้ใช้', 401);
  ok(res, user);
}
