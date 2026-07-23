import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  getOwnRegistrations,
  replaceStudentAvailability,
} from '../src/features/reviews/studentAvailability.js';

const slots = [
  { dayOfWeek: 1, slot: 1 },
  { dayOfWeek: 2, slot: 2 },
  { dayOfWeek: 3, slot: 3 },
  { dayOfWeek: 4, slot: 4 },
  { dayOfWeek: 6, slot: 5 },
];

test('ưu tiên myAvailability từ contract StudentSlotGridResponse', () => {
  const own = getOwnRegistrations({
    myAvailability: [{ groupId: 20, dayOfWeek: 2, slot: 2 }],
    registrations: [{ groupId: 10, dayOfWeek: 1, slot: 1 }],
  }, 10);

  assert.deepEqual(own, [{ groupId: 20, dayOfWeek: 2, slot: 2 }]);
});

test('lưu đúng 5 slot qua endpoint transactional của backend', async () => {
  const calls = [];
  const apiClient = {
    get: async () => ({ data: { myAvailability: slots } }),
    put: async (url, body) => { calls.push({ url, body }); },
  };

  const result = await replaceStudentAvailability(apiClient, { roundId: 3, slots });

  assert.equal(result.persistenceMode, 'transactional');
  assert.deepEqual(calls, [{
    url: '/student-review/slots',
    body: { roundId: 3, slots },
  }]);
});

test('không báo thành công nếu backend không lưu đủ 5 slot', async () => {
  const apiClient = {
    get: async () => ({ data: { myAvailability: slots.slice(0, 1) } }),
    put: async () => undefined,
  };

  await assert.rejects(
    replaceStudentAvailability(apiClient, { roundId: 3, slots }),
    /1\/5 slot/
  );
});

test('màn hình đăng ký chặn slot thứ 6 và lưu qua luồng validation transactional', async () => {
  const source = await readFile(
    new URL('../src/pages/student/ReviewRegistrationPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /selectedSlots\.length\s*>=\s*REQUIRED_STUDENT_AVAILABILITY_SLOTS/);
  assert.match(source, /replaceStudentAvailability\(api,/);
  assert.match(source, /selectedSlots\.length\s*!==\s*REQUIRED_STUDENT_AVAILABILITY_SLOTS/);
});
