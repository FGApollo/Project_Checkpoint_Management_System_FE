import assert from 'node:assert/strict';
import test from 'node:test';
import { selectRelevantReviewRound } from '../src/features/reviews/reviewRoundSelection.js';

const rounds = [
  { id: 3, type: 'Review3', weekStartDate: '2026-08-03', weekEndDate: '2026-08-08' },
  { id: 2, type: 'Review2', weekStartDate: '2026-07-20', weekEndDate: '2026-07-25' },
  { id: 1, type: 'Review1', weekStartDate: '2026-06-08', weekEndDate: '2026-06-13' },
];

test('selects the review round that contains the current review date', () => {
  assert.equal(selectRelevantReviewRound(rounds, new Date('2026-07-23T04:00:00Z')).type, 'Review2');
});

test('selects the nearest upcoming round when no round is currently running', () => {
  assert.equal(selectRelevantReviewRound(rounds, new Date('2026-07-01T04:00:00Z')).type, 'Review2');
});

test('selects the latest completed round after all review windows', () => {
  assert.equal(selectRelevantReviewRound(rounds, new Date('2026-09-01T04:00:00Z')).type, 'Review3');
});
