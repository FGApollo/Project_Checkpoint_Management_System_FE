import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSlotRegistrationCountMap,
  getSlotRegistrationCount,
  isSlotRegistrationDisabled,
  isSlotRegistrationFull,
  slotRegistrationKey,
} from '../src/features/reviews/slotRegistrationCapacity.js';

test('maps BE slot registration counts to the 6x5 grid', () => {
  const map = buildSlotRegistrationCountMap([
    { dayOfWeek: 4, slot: 3, registeredCount: 4 },
    { dayOfWeek: 2, slot: 1, registeredCount: 2 },
    { dayOfWeek: 9, slot: 1, registeredCount: 99 },
  ]);

  assert.equal(slotRegistrationKey(4, 3), '4-3');
  assert.equal(getSlotRegistrationCount(map, 4, 3), 4);
  assert.equal(getSlotRegistrationCount(map, 1, 1), 0);
  assert.equal(map['9-1'], undefined);
});

test('uses role capacity when determining whether a slot is full', () => {
  assert.equal(isSlotRegistrationFull(3, 4), false);
  assert.equal(isSlotRegistrationFull(4, 4), true);
  assert.equal(isSlotRegistrationFull(3, 3), true);
  assert.equal(isSlotRegistrationFull(4, 3), true);
});

test('a full slot blocks new registration but still allows its owner to deselect', () => {
  assert.equal(isSlotRegistrationDisabled({
    selected: false,
    registeredCount: 4,
    capacity: 4,
  }), true);
  assert.equal(isSlotRegistrationDisabled({
    selected: true,
    registeredCount: 4,
    capacity: 4,
  }), false);
  assert.equal(isSlotRegistrationDisabled({
    selected: false,
    registeredByCurrentUser: true,
    registeredCount: 4,
    capacity: 4,
  }), false);
});
