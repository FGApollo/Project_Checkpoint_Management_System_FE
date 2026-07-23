import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateReviewDates,
  calculateSemesterReviewPlan,
  getRegistrationEndDate,
  getRegistrationStartDate,
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
  assert.equal(getRegistrationStartDate({
    registrationEndDate: '2026-07-15',
    weekStartDate: '2026-07-20',
  }), '2026-07-08');
});

test('four-month semesters receive three evenly spaced review windows', () => {
  assert.deepEqual(calculateSemesterReviewPlan({
    startDate: '2026-05-01',
    endDate: '2026-08-31',
  }), [
    {
      reviewType: 'Review1',
      registrationStartDate: '2026-05-27',
      registrationEndDate: '2026-06-03',
      weekStartDate: '2026-06-08',
      weekEndDate: '2026-06-13',
    },
    {
      reviewType: 'Review2',
      registrationStartDate: '2026-07-01',
      registrationEndDate: '2026-07-08',
      weekStartDate: '2026-07-13',
      weekEndDate: '2026-07-18',
    },
    {
      reviewType: 'Review3',
      registrationStartDate: '2026-08-05',
      registrationEndDate: '2026-08-12',
      weekStartDate: '2026-08-17',
      weekEndDate: '2026-08-22',
    },
  ]);
});

test('Spring, Summer and Fall plans stay inside the semester with four-week spacing', () => {
  const semesters = [
    { startDate: '2026-01-05', endDate: '2026-04-30' },
    { startDate: '2026-05-01', endDate: '2026-08-31' },
    { startDate: '2026-09-05', endDate: '2026-12-01' },
    { startDate: '2027-01-01', endDate: '2027-04-30' },
  ];

  semesters.forEach((semester) => {
    const plan = calculateSemesterReviewPlan(semester);
    assert.equal(plan.length, 3);
    plan.forEach((item) => {
      assert.ok(item.registrationStartDate >= semester.startDate);
      assert.ok(item.weekEndDate <= semester.endDate);
      assert.equal(isWednesday(item.registrationEndDate), true);
    });
    assert.ok(
      (Date.parse(plan[1].weekStartDate) - Date.parse(plan[0].weekStartDate))
        / (24 * 60 * 60 * 1000) >= 28
    );
    assert.ok(
      (Date.parse(plan[2].weekStartDate) - Date.parse(plan[1].weekStartDate))
        / (24 * 60 * 60 * 1000) >= 28
    );
  });
});
