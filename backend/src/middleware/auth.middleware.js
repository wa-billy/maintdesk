import jwt from 'jsonwebtoken';
import { AppError } from '../utils/http.js';

export function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('กรุณาเข้าสู่ระบบ', 401);
  try {
    const { sub, role } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: sub, role };
  } catch {
    throw new AppError('token ไม่ถูกต้องหรือหมดอายุ', 401);
  }
  next();
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError('ไม่มีสิทธิ์เข้าถึง', 403);
  next();
};
