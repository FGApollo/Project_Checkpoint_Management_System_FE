import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getReviewSlotCapacityViolations,
  getStudentAvailabilityValidationError,
  isRegistrationOpen,
  ROUND_STATUS,
} from '../src/features/reviews/reviewDomain.js';

test('chỉ trạng thái Open cho phép đăng ký', () => {
  assert.equal(isRegistrationOpen(ROUND_STATUS.OPEN), true);
  assert.equal(isRegistrationOpen(ROUND_STATUS.DRAFT), false);
  assert.equal(isRegistrationOpen(ROUND_STATUS.CLOSED), false);
  assert.equal(isRegistrationOpen(ROUND_STATUS.PUBLISHED), false);
});

test('availability sinh viên phải có đúng 5 slot hợp lệ và không trùng', () => {
  const validSlots = [
    { dayOfWeek: 1, slot: 1 },
    { dayOfWeek: 2, slot: 2 },
    { dayOfWeek: 3, slot: 3 },
    { dayOfWeek: 4, slot: 4 },
    { dayOfWeek: 6, slot: 5 },
  ];

  assert.equal(getStudentAvailabilityValidationError(validSlots), null);
  assert.match(getStudentAvailabilityValidationError(validSlots.slice(0, 4)), /đúng 5/);
  assert.match(getStudentAvailabilityValidationError([...validSlots.slice(0, 4), validSlots[0]]), /trùng/);
  assert.match(getStudentAvailabilityValidationError([...validSlots.slice(0, 4), { dayOfWeek: 0, slot: 5 }]), /Thứ Hai/);
  assert.match(getStudentAvailabilityValidationError([...validSlots.slice(0, 4), { dayOfWeek: 5, slot: 6 }]), /1 đến 5/);
});

test('phát hiện ca có hơn 3 nhóm và không đếm trùng cùng một nhóm', () => {
  const sessions = [
    { id: 1, groupId: 101, dayOfWeek: 2, slot: 3 },
    { id: 2, groupId: 102, dayOfWeek: 2, slot: 3 },
    { id: 3, groupId: 103, dayOfWeek: 2, slot: 3 },
    { id: 4, groupId: 104, dayOfWeek: 2, slot: 3 },
    { id: 5, groupId: 104, dayOfWeek: 2, slot: 3 },
    { id: 6, groupId: 201, dayOfWeek: 4, slot: 1 },
  ];

  assert.deepEqual(getReviewSlotCapacityViolations(sessions), [
    { dayOfWeek: 2, slot: 3, groupCount: 4 },
  ]);
});
