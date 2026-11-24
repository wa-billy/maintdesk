import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paging } from '../src/utils/http.js';

test('paging จำกัด limit ไม่เกิน 100', () => {
  assert.deepEqual(paging({ page: '2', limit: '500' }), { page: 2, limit: 100, offset: 100 });
});

test('page ที่ผิดรูปแบบกลายเป็น 1', () => {
  assert.equal(paging({ page: '-3' }).page, 1);
});