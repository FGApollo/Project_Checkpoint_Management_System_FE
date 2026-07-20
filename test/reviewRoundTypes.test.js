import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableReviewTypes,
  getDuplicateReviewTypes,
  normalizeReviewType
} from '../src/features/reviews/reviewRoundTypes.js';

test('normalizes API enum values and names', () => {
  assert.equal(normalizeReviewType(0), 'Review1');
  assert.equal(normalizeReviewType('Review2'), 'Review2');
});

test('offers only review types not yet created in a semester', () => {
  assert.deepEqual(getAvailableReviewTypes([{ type: 'Review1' }, { type: 2 }]), ['Review2']);
});

test('detects duplicate review types returned by an inconsistent API', () => {
  assert.deepEqual(getDuplicateReviewTypes([{ type: 'Review1' }, { type: 0 }, { type: 'Review2' }]), ['Review1']);
});
