// import { test, before, after } from 'node:test';
// import assert from 'node:assert/strict';
// import jwt from 'jsonwebtoken';
// import { startApp } from './helper.js';

// let api;
// before(async () => { api = await startApp(); });
// after(() => api.close());

// test('GET /api/health ได้ 200', async () => {
//   const res = await fetch(`${api.url}/api/health`);
//   assert.equal(res.status, 200);
// });

// test('GET /api/auth/me โดยไม่มี token ได้ 401', async () => {
//   const res = await fetch(`${api.url}/api/auth/me`);
//   assert.equal(res.status, 401);
//   assert.equal((await res.json()).status, 'error');
// });

// test('GET /api/admin/users ด้วย token ของ reporter ได้ 403', async () => {
//   const token = jwt.sign({ sub: '019abc00-0000-7000-8000-000000000004', role: 'reporter' }, process.env.JWT_SECRET);
//   const res = await fetch(`${api.url}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
//   assert.equal(res.status, 403);
// });
