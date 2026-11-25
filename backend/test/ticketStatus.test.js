import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, canSetStatus } from '../src/domain/ticketStatus.js';

const allowed = [
  ['new', 'assigned', 'admin'],
  ['assigned', 'in_progress', 'technician'],
  ['in_progress', 'done', 'technician'],
  ['new', 'cancelled', 'reporter'],
  ['new', 'cancelled', 'admin'],
  ['assigned', 'cancelled', 'admin'],
];

for (const [from, to, role] of allowed) {
  test(`${from} → ${to} โดย ${role} ผ่าน`, () => {
    assert.equal(canTransition(from, to, role), true);
  });
}

const denied = [
  ['new', 'done', 'admin'],
  ['new', 'in_progress', 'reporter'],
  ['assigned', 'in_progress', 'reporter'],
  ['new', 'assigned', 'technician'],
  ['assigned', 'cancelled', 'reporter'],
  ['in_progress', 'cancelled', 'admin'],
  ['done', 'cancelled', 'admin'],
  ['cancelled', 'new', 'admin'],
  ['done', 'in_progress', 'technician'],
];

for (const [from, to, role] of denied) {
  test(`${from} → ${to} โดย ${role} ไม่ผ่าน`, () => {
    assert.equal(canTransition(from, to, role), false);
  });
}

test('canSetStatus: role ที่ไม่มีกฎไปถึงสถานะนั้นได้ false', () => {
  assert.equal(canSetStatus('in_progress', 'reporter'), false);
  assert.equal(canSetStatus('done', 'admin'), false);
  assert.equal(canSetStatus('cancelled', 'technician'), false);
  assert.equal(canSetStatus('cancelled', 'reporter'), true);
  assert.equal(canSetStatus('done', 'technician'), true);
});
