import bcrypt from 'bcryptjs';
import { matchedData } from 'express-validator';
import { pool } from '../../config/db.js';
import { AppError, ok, created } from '../../utils/http.js';

const COLUMNS = 'id, username, full_name, role, is_active, created_at';

async function findUser(id) {
  const { rows: [user] } = await pool.query(`SELECT ${COLUMNS} FROM users WHERE id = $1`, [id]);
  if (!user) throw new AppError('ไม่พบผู้ใช้', 404);
  return user;
}

const isSelf = (req) => req.params.id.toLowerCase() === req.user.id;

export async function list(req, res) {
  const { q, role, is_active, page = 1, limit = 10 } = matchedData(req, { includeOptionals: true });
  const params = [];
  const where = ['true'];
  if (q) {
    params.push(`%${q}%`);
    where.push(`(username ILIKE $${params.length} OR full_name ILIKE $${params.length})`);
  }
  if (role) {
    params.push(role);
    where.push(`role = $${params.length}`);
  }
  if (typeof is_active === 'boolean') {
    params.push(is_active);
    where.push(`is_active = $${params.length}`);
  }
  const sqlWhere = where.join(' AND ');

  const { rows: [{ total }] } = await pool.query(
    `SELECT count(*)::int AS total FROM users WHERE ${sqlWhere}`, params);
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM users WHERE ${sqlWhere} ORDER BY id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]);
  ok(res, rows, undefined, { page, limit, total });
}

export async function get(req, res) {
  ok(res, await findUser(req.params.id));
}

export async function create(req, res) {
  const { username, password, full_name, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { rows: [user] } = await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
    [username, hash, full_name, role]);
  created(res, user, 'เพิ่มผู้ใช้สำเร็จ');
}

export async function update(req, res) {
  const { full_name, role } = req.body;
  const old = await findUser(req.params.id);
  if (old.role === 'admin' && role !== 'admin') {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM users WHERE role = 'admin' AND is_active AND id <> $1`, [old.id]);
    if (!rowCount) throw new AppError('เปลี่ยน role ไม่ได้ เพราะเป็นผู้ดูแลระบบคนสุดท้าย', 409);
  }
  const { rows: [user] } = await pool.query(
    `UPDATE users SET full_name = $1, role = $2 WHERE id = $3 RETURNING ${COLUMNS}`,
    [full_name, role, old.id]);
  ok(res, user, 'แก้ไขผู้ใช้สำเร็จ');
}

export async function changePassword(req, res) {
  const hash = await bcrypt.hash(req.body.password, 10);
  const { rowCount } = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
  if (!rowCount) throw new AppError('ไม่พบผู้ใช้', 404);
  ok(res, null, 'เปลี่ยนรหัสผ่านสำเร็จ');
}

export async function setActive(req, res) {
  const { is_active } = req.body;
  if (isSelf(req) && !is_active) throw new AppError('ปิดบัญชีของตัวเองไม่ได้', 409);
  const { rows: [user] } = await pool.query(
    `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING ${COLUMNS}`, [is_active, req.params.id]);
  if (!user) throw new AppError('ไม่พบผู้ใช้', 404);
  ok(res, user, is_active ? 'เปิดใช้งานบัญชีสำเร็จ' : 'ปิดใช้งานบัญชีสำเร็จ');
}

export async function remove(req, res) {
  if (isSelf(req)) throw new AppError('ลบบัญชีของตัวเองไม่ได้', 409);
  const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (!rowCount) throw new AppError('ไม่พบผู้ใช้', 404);
  ok(res, null, 'ลบผู้ใช้สำเร็จ');
}
