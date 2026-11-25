import { pool } from '../../config/db.js';
import { canTransition } from '../../domain/ticketStatus.js';
import { AppError, ok } from '../../utils/http.js';

export async function assign(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [old] } = await client.query('SELECT * FROM tickets WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!old) throw new AppError('ไม่พบใบงาน', 404);
    if (!['new', 'assigned', 'in_progress'].includes(old.status)) {
      throw new AppError('มอบงานไม่ได้ เพราะใบงานปิดหรือยกเลิกแล้ว', 409);
    }

    const status = canTransition(old.status, 'assigned', req.user.role) ? 'assigned' : old.status;
    const { rows: [ticket] } = await client.query(
      `UPDATE tickets SET technician_id = $1, status = $2, updated_at = now() WHERE id = $3 RETURNING *`,
      [req.body.technician_id, status, old.id]);
    await client.query(
      `INSERT INTO ticket_logs (ticket_id, actor_id, from_status, to_status, note) VALUES ($1, $2, $3, $4, $5)`,
      [old.id, req.user.id, old.status, status, status === old.status ? 'เปลี่ยนช่าง' : null]);
    await client.query('COMMIT');
    ok(res, ticket, 'มอบงานสำเร็จ');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
