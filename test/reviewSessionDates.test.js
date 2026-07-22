import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  filterReviewSessions,
  getDaysUntilReview,
  getReviewDateKey,
  getReviewReminder,
} from '../src/features/reviews/reviewSessionDates.js';

const today = new Date('2026-07-23T03:00:00Z');
const sessions = [
  { id: 1, sessionDate: '2026-07-22T16:30:00Z' },
  { id: 2, sessionDate: '2026-07-22T17:30:00Z' },
  { id: 3, sessionDate: '2026-07-24T00:00:00Z' },
  { id: 4, sessionDate: '2026-08-04T00:00:00Z' },
];

test('review dates use Vietnam calendar boundaries', () => {
  assert.equal(getReviewDateKey('2026-07-22T16:30:00Z'), '2026-07-22');
  assert.equal(getReviewDateKey('2026-07-22T17:30:00Z'), '2026-07-23');
  assert.equal(getDaysUntilReview('2026-07-22T17:30:00Z', today), 0);
});

test('today reviews have their own filter and upcoming reviews exclude today', () => {
  assert.deepEqual(filterReviewSessions(sessions, 'today', today).map((item) => item.id), [2]);
  assert.deepEqual(filterReviewSessions(sessions, 'upcoming', today).map((item) => item.id), [3, 4]);
  assert.deepEqual(filterReviewSessions(sessions, 'all', today).map((item) => item.id), [1, 2, 3, 4]);
});

test('upcoming review reminders count down to the session date', () => {
  assert.equal(getReviewReminder('2026-07-23T00:00:00Z', today), 'Hôm nay');
  assert.equal(getReviewReminder('2026-07-24T00:00:00Z', today), 'Ngày mai');
  assert.equal(getReviewReminder('2026-08-04T00:00:00Z', today), 'Còn 12 ngày');
  assert.equal(getReviewReminder('2026-07-22T00:00:00Z', today), null);
});

test('lecturer and student review UIs expose today and upcoming tabs with reminder badges', async () => {
  const [reviewPage, lecturerDashboard, studentSchedule, studentDashboard, registrationPage] = await Promise.all([
    readFile(new URL('../src/pages/lecturer/ReviewScoringPage.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/lecturer/LecturerDashboard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/reviews/StudentReviewSchedule.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/student/StudentDashboard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/student/ReviewRegistrationPage.jsx', import.meta.url), 'utf8'),
  ]);

  assert.match(reviewPage, /role="tablist"/);
  assert.match(reviewPage, /label: 'Hôm nay'/);
  assert.match(reviewPage, /label: 'Sắp tới'/);
  assert.match(reviewPage, /filterReviewSessions\(sessions, sessionFilter\)/);
  assert.match(reviewPage, /getReviewReminder\(dateGroup\.date\)/);
  assert.match(lecturerDashboard, /getReviewReminder\(review\.sessionDate/);
  assert.match(studentSchedule, /role="tablist"/);
  assert.match(studentSchedule, /label: 'Hôm nay'/);
  assert.match(studentSchedule, /label: 'Sắp tới'/);
  assert.match(studentSchedule, /getReviewSlotLabel\(schedule\.slot\)/);
  assert.match(studentSchedule, /getReviewReminder\(schedule\.sessionDate\)/);
  assert.match(studentDashboard, /<StudentReviewSchedule schedules=\{mySchedules\}/);
  assert.match(registrationPage, /<StudentReviewSchedule schedules=\{mySchedules\}/);
});
