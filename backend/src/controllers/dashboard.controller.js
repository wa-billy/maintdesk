import { pool } from '../config/db.js';
import { scopeFor } from '../domain/scope.js';
import { ok } from '../utils/http.js';

export async function summary(req, res) {
  const params = [];
  const scope = scopeFor(req.user, params);

  const { rows: [counts] } = await pool.query(
    `SELECT
      count(*) FILTER (WHERE t.status = 'new')::int AS "new",
      count(*) FILTER (WHERE t.status = 'assigned')::int AS assigned,
      count(*) FILTER (WHERE t.status = 'in_progress')::int AS in_progress,
      count(*) FILTER (WHERE t.status = 'done')::int AS done,
      count(*) FILTER (WHERE t.status = 'cancelled')::int AS cancelled,
      count(*) FILTER (WHERE t.status = 'new' AND t.technician_id IS NULL)::int AS unassigned,
      round(avg(extract(epoch FROM t.resolved_at - t.created_at) / 3600)
        FILTER (WHERE t.status = 'done'), 1)::float AS avg_resolve_hours
    FROM tickets t WHERE ${scope}`, params);
  const { unassigned, avg_resolve_hours, ...status_counts } = counts;

  const { rows: recent } = await pool.query(
    `SELECT t.id, t.title, t.status, t.created_at FROM tickets t WHERE ${scope} ORDER BY t.id DESC LIMIT 5`, params);

  const data = { status_counts, recent };
  if (req.user.role !== 'reporter') data.avg_resolve_hours = avg_resolve_hours;

  if (req.user.role === 'admin') {
    const { rows: by_category } = await pool.query(
    `SELECT c.name, count(t.id)::int AS count
      FROM categories c LEFT JOIN tickets t ON t.category_id = c.id AND ${scope}
      GROUP BY c.id ORDER BY count DESC, c.name`, params);
    const { rows: technician_load } = await pool.query(
    `SELECT u.full_name, count(t.id)::int AS open
      FROM users u LEFT JOIN tickets t
        ON t.technician_id = u.id AND t.status IN ('assigned', 'in_progress') AND ${scope}
      WHERE u.role = 'technician' AND u.is_active
      GROUP BY u.id ORDER BY open DESC, u.full_name`, params);
    const { rows: daily_new } = await pool.query(
    `SELECT to_char(d, 'YYYY-MM-DD') AS date, count(t.id)::int AS count
      FROM generate_series((now() AT TIME ZONE 'Asia/Bangkok')::date - 6, (now() AT TIME ZONE 'Asia/Bangkok')::date, interval '1 day') AS d
      LEFT JOIN tickets t ON (t.created_at AT TIME ZONE 'Asia/Bangkok')::date = d::date AND ${scope}
      GROUP BY d ORDER BY d`, params);
    Object.assign(data, { unassigned, by_category, technician_load, daily_new });
  }

  ok(res, data);
}
