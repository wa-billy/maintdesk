import { matchedData } from 'express-validator';
import { pool } from '../config/db.js';
import { scopeFor } from '../domain/scope.js';
import { canTransition, canSetStatus } from '../domain/ticketStatus.js';
import { AppError, ok, created } from '../utils/http.js';
import { removeFile } from '../utils/files.js';

const REFS = `
  (SELECT json_build_object('id', id, 'name', name, 'image_url', '/api/uploads/' || image_path) FROM categories WHERE id = t.category_id) AS category,
  (SELECT json_build_object('id', id, 'full_name', full_name) FROM users WHERE id = t.reporter_id) AS reporter,
  (SELECT json_build_object('id', id, 'full_name', full_name) FROM users WHERE id = t.technician_id) AS technician`;

async function findInScope(req, db = pool) {
  const params = [req.params.id];
  const { rows: [ticket] } = await db.query(
    `SELECT * FROM tickets t WHERE t.id = $1 AND ${scopeFor(req.user, params)} FOR UPDATE`, params);
  if (!ticket) throw new AppError('ไม่พบใบงาน', 404);
  return ticket;
}

export async function list(req, res) {
  const { q, status, category_id, page = 1, limit = 10 } = matchedData(req);
  const params = [];
  const where = [scopeFor(req.user, params)];
  if (q) {
    params.push(`%${q}%`);
    where.push(`(t.title ILIKE $${params.length} OR t.location ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    where.push(`t.status = $${params.length}`);
  }
  if (category_id) {
    params.push(category_id);
    where.push(`t.category_id = $${params.length}`);
  }
  const sqlWhere = where.join(' AND ');

  const { rows: [{ total }] } = await pool.query(
    `SELECT count(*)::int AS total FROM tickets t WHERE ${sqlWhere}`, params);
  const { rows } = await pool.query(
    `SELECT t.id, t.title, t.location, t.status, t.created_at, ${REFS}
    FROM tickets t WHERE ${sqlWhere}
    ORDER BY t.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]);
  ok(res, rows, undefined, { page, limit, total });
}

export async function get(req, res) {
  const params = [req.params.id];
  const { rows: [ticket] } = await pool.query(
    `SELECT t.*,
      '/api/uploads/' || t.report_attachment_path AS report_attachment_url,
      '/api/uploads/' || t.repair_image_path AS repair_image_url, ${REFS}
    FROM tickets t WHERE t.id = $1 AND ${scopeFor(req.user, params)}`, params);
  if (!ticket) throw new AppError('ไม่พบใบงาน', 404);

  const { rows: logs } = await pool.query(
    `SELECT l.from_status, l.to_status, u.full_name AS actor, l.note, l.created_at
    FROM ticket_logs l JOIN users u ON u.id = l.actor_id
    WHERE l.ticket_id = $1 ORDER BY l.created_at, l.id`, [ticket.id]);
  ok(res, { ...ticket, logs });
}

export async function create(req, res) {
  const { title, description, location, category_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [ticket] } = await client.query(
      `INSERT INTO tickets (title, description, location, category_id, reporter_id, report_attachment_path)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, location, category_id, req.user.id, req.file?.filename ?? null]);
    await client.query(
      `INSERT INTO ticket_logs (ticket_id, actor_id, to_status) VALUES ($1, $2, 'new')`,
      [ticket.id, req.user.id]);
    await client.query('COMMIT');
    created(res, ticket, 'แจ้งซ่อมสำเร็จ');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function update(req, res) {
  const old = await findInScope(req);
  if (old.status !== 'new') throw new AppError('แก้ไขได้เฉพาะใบงานที่ยังไม่ได้มอบหมาย', 409);

  const { title, description, location, category_id } = req.body;
  const { rows: [ticket] } = await pool.query(
    `UPDATE tickets SET title = $1, description = $2, location = $3, category_id = $4,
       report_attachment_path = COALESCE($5, report_attachment_path), updated_at = now()
     WHERE id = $6 RETURNING *`,
    [title, description, location, category_id, req.file?.filename ?? null, old.id]);
  if (req.file) await removeFile(old.report_attachment_path);
  ok(res, ticket, 'แก้ไขใบงานสำเร็จ');
}

export async function changeStatus(req, res) {
  const { status, note, repair_cost } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const old = await findInScope(req, client);
    if (!canSetStatus(status, req.user.role)) throw new AppError('ไม่มีสิทธิ์เปลี่ยนเป็นสถานะนี้', 403);
    if (!canTransition(old.status, status, req.user.role)) {
      throw new AppError(`เปลี่ยนสถานะจาก ${old.status} เป็น ${status} ไม่ได้`, 409);
    }
    if (status === 'done' && !old.repair_image_path) {
      throw new AppError('ข้อมูลไม่ถูกต้อง', 422, [{ field: 'repair_image', message: 'กรุณาแนบรูปหลังซ่อมก่อนปิดงาน' }]);
    }

    const done = status === 'done';
    const { rows: [ticket] } = await client.query(
      `UPDATE tickets SET status = $1, updated_at = now(), resolved_at = CASE WHEN $2::boolean THEN now() END, repair_cost = $3
       WHERE id = $4 RETURNING *`,
      [status, done, done ? repair_cost ?? null : null, old.id]);
    await client.query(
      `INSERT INTO ticket_logs (ticket_id, actor_id, from_status, to_status, note) VALUES ($1, $2, $3, $4, $5)`,
      [old.id, req.user.id, old.status, status, note || null]);
    await client.query('COMMIT');
    ok(res, ticket, 'เปลี่ยนสถานะสำเร็จ');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function repairImage(req, res) {
  if (!req.file) throw new AppError('ข้อมูลไม่ถูกต้อง', 422, [{ field: 'repair_image', message: 'กรุณาแนบรูปหลังซ่อม' }]);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const old = await findInScope(req, client);
    if (!['in_progress', 'done'].includes(old.status)) {
      throw new AppError('แนบรูปหลังซ่อมได้เฉพาะงานที่กำลังซ่อมหรือปิดงานแล้ว', 409);
    }

    const { rows: [ticket] } = await client.query(
      `UPDATE tickets SET repair_image_path = $1, updated_at = now() WHERE id = $2
       RETURNING *, '/api/uploads/' || repair_image_path AS repair_image_url`,
      [req.file.filename, old.id]);
    await client.query(
      `INSERT INTO ticket_logs (ticket_id, actor_id, from_status, to_status, note) VALUES ($1, $2, $3, $3, 'เปลี่ยนรูปหลังซ่อม')`,
      [old.id, req.user.id, old.status]);
    await client.query('COMMIT');
    await removeFile(old.repair_image_path);
    ok(res, ticket, 'บันทึกรูปหลังซ่อมสำเร็จ');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function remove(req, res) {
  const old = await findInScope(req);
  if (old.status !== 'new') throw new AppError('ลบได้เฉพาะใบงานที่ยังไม่ได้มอบหมาย ให้ใช้การยกเลิกแทน', 409);

  await pool.query('DELETE FROM tickets WHERE id = $1', [old.id]);
  await removeFile(old.report_attachment_path);
  ok(res, null, 'ลบใบงานสำเร็จ');
}
