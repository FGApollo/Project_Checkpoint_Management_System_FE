import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateReviewDates,
  getRegistrationEndDate,
  isWednesday,
} from '../src/features/reviews/reviewRoundDates.js';

test('review schedule starts five days after registration closes', () => {
  assert.deepEqual(calculateReviewDates('2026-07-08'), {
    weekStartDate: '2026-07-13',
    weekEndDate: '2026-07-18',
  });
  assert.equal(isWednesday('2026-07-08'), true);
  assert.equal(isWednesday('2026-07-09'), false);
});

test('old round responses derive the registration deadline without changing stored data', () => {
  assert.equal(getRegistrationEndDate({ weekStartDate: '2026-07-13' }), '2026-07-08');
  assert.equal(getRegistrationEndDate({
    registrationEndDate: '2026-07-15',
    weekStartDate: '2026-07-20',
  }), '2026-07-15');
});
