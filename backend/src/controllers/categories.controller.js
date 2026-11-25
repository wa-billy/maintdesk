import { pool } from '../config/db.js';
import { ok } from '../utils/http.js';

export async function list(req, res) {
  const { rows } = await pool.query(
    `SELECT id, name, '/api/uploads/' || image_path AS image_url FROM categories ORDER BY id`,
  );
  ok(res, rows);
}
