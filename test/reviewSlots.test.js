import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  REVIEW_LUNCH_BREAK,
  REVIEW_SLOTS,
  getReviewSlotLabel,
  getReviewSlotTime,
} from '../src/features/reviews/reviewSlots.js';

const toMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

test('five review slots cover 07:30 to 19:00 without crossing the lunch break', () => {
  assert.equal(REVIEW_SLOTS.length, 5);
  assert.equal(REVIEW_SLOTS[0].start, '07:30');
  assert.equal(REVIEW_SLOTS.at(-1).end, '19:00');
  assert.deepEqual(REVIEW_LUNCH_BREAK, {
    start: '11:45',
    end: '12:30',
    label: 'Nghỉ trưa 11:45 – 12:30',
  });

  const lunchStart = toMinutes(REVIEW_LUNCH_BREAK.start);
  const lunchEnd = toMinutes(REVIEW_LUNCH_BREAK.end);
  const durations = REVIEW_SLOTS.map((slot) => {
    const start = toMinutes(slot.start);
    const end = toMinutes(slot.end);
    assert.ok(end <= lunchStart || start >= lunchEnd, `${slot.name} overlaps the lunch break`);
    return end - start;
  });

  assert.ok(durations.every((duration) => duration === 120));
  assert.equal(getReviewSlotTime(5), '17:00 – 19:00');
  assert.equal(getReviewSlotLabel(3), 'Slot 3 (12:30 – 14:30)');
});

test('lecturer can edit and resubmit availability while the round remains open', async () => {
  const source = await readFile(
    new URL('../src/pages/lecturer/AvailabilityPage.jsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /const canModifyAvailability = canEditAvailability && \(!isSubmitted \|\| isEditingSubmitted\)/);
  assert.match(source, /Chỉnh sửa đăng ký/);
  assert.match(source, /Nộp lại/);
  assert.match(source, /disabled=\{loading \|\| !canModifyAvailability\}/);
});
