import { ERROR } from "../../constants.js";
import { AppError } from "../utils/http.js";
import jwt from 'jsonwebtoken';

export function authenticate(req, res , next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(...ERROR.DENIED('Access'));
  try {
    req.user = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new AppError(...ERROR.DENIED('Permission'));
  }
  next();
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) throw new AppError(...ERROR.FORBIDDEN);
  next()
}