import fs from 'node:fs/promises';
import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool(env.db);

export async function initDb() {
  for (const file of ['schema.sql']) {
    const sql = await fs.readFile(new URL(`../../db/${file}`, import.meta.url), 'utf8');
    await pool.query(sql);
  }
}