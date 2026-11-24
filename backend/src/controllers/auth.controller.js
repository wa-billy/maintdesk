import { pool } from "../config/db.js";
import bcrypt from 'bcryptjs';
import { AppError, ok } from "../utils/http.js";
import { ERROR } from "../../constants.js";
import jwt from 'jsonwebtoken';
import { env } from "../config/env.js";

export async function login (req, res) {
  const { username, password } = req.body;
  const { rows: [user] } = pool.query(`
      SELECT * FROM users WHERE username = $1
    `, [username])
  if (!user || !(await bcrypt.compare(password, user.password))) throw new AppError(...ERROR.INVALID('Username or Password'));
  const profile = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(profile, env.jwtSecret, { expiresIn: env.jwtExp });

  ok(res, { token, user: profile });
}

export const me = (req, res) => ok(res, req.user);