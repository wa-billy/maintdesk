import { pool } from '../../config/db.js';
import { AppError, ok, created } from '../../utils/http.js';
import { removeFile } from '../../utils/files.js';

const RETURNING = `RETURNING id, name, '/api/uploads/' || image_path AS image_url`;

export async function create(req, res) {
  const { rows: [category] } = await pool.query(
    `INSERT INTO categories (name, image_path) VALUES ($1, $2) ${RETURNING}`,
    [req.body.name, req.file?.filename ?? null],
  );
  created(res, category, 'เพิ่มหมวดหมู่สำเร็จ');
}

export async function update(req, res) {
  const { rows: [old] } = await pool.query('SELECT image_path FROM categories WHERE id = $1', [req.params.id]);
  if (!old) throw new AppError('ไม่พบหมวดหมู่', 404);

  const { rows: [category] } = await pool.query(
    `UPDATE categories SET name = $1, image_path = COALESCE($2, image_path) WHERE id = $3 ${RETURNING}`,
    [req.body.name, req.file?.filename ?? null, req.params.id],
  );
  if (req.file) await removeFile(old.image_path);
  ok(res, category, 'แก้ไขหมวดหมู่สำเร็จ');
}

export async function remove(req, res) {
  const { rows: [old] } = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING image_path', [req.params.id]);
  if (!old) throw new AppError('ไม่พบหมวดหมู่', 404);
  await removeFile(old.image_path);
  ok(res, null, 'ลบหมวดหมู่สำเร็จ');
}
