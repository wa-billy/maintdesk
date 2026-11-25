export class AppError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const ok = (res, data, message = 'ดึงข้อมูลสำเร็จ', meta) =>
  res.json({ status: 'success', message, data, ...(meta && { meta }) });

export const created = (res, data, message = 'สร้างข้อมูลสำเร็จ') =>
  res.status(201).json({ status: 'success', message, data });

export function paging(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit, offset: (page - 1) * limit };
};
