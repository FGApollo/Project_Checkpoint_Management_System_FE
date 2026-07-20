import test from 'node:test';
import assert from 'node:assert/strict';
import { getActivationBlockedMessage, isDateWithinSemester } from '../src/features/semesters/semesterDates.js';

const summer = { code: 'SU26', startDate: '2026-05-01', endDate: '2026-08-31' };

test('allows semester activation only inside the inclusive date range', () => {
  assert.equal(isDateWithinSemester(summer, '2026-05-01'), true);
  assert.equal(isDateWithinSemester(summer, '2026-07-20'), true);
  assert.equal(isDateWithinSemester(summer, '2026-08-31'), true);
  assert.equal(isDateWithinSemester(summer, '2026-09-01'), false);
});

test('explains why an out-of-range semester cannot be opened', () => {
  assert.match(getActivationBlockedMessage(summer, '2026-09-01'), /không nằm trong thời gian/i);
});
