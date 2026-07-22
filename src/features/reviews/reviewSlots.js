export const REVIEW_LUNCH_BREAK = Object.freeze({
  start: '11:45',
  end: '12:30',
  label: 'Nghỉ trưa 11:45 – 12:30',
});

export const REVIEW_SLOTS = Object.freeze([
  Object.freeze({ id: 1, name: 'Slot 1', start: '07:30', end: '09:30', time: '07:30 – 09:30' }),
  Object.freeze({ id: 2, name: 'Slot 2', start: '09:45', end: '11:45', time: '09:45 – 11:45' }),
  Object.freeze({ id: 3, name: 'Slot 3', start: '12:30', end: '14:30', time: '12:30 – 14:30' }),
  Object.freeze({ id: 4, name: 'Slot 4', start: '14:45', end: '16:45', time: '14:45 – 16:45' }),
  Object.freeze({ id: 5, name: 'Slot 5', start: '17:00', end: '19:00', time: '17:00 – 19:00' }),
]);

export const getReviewSlot = (slotId) => REVIEW_SLOTS.find((slot) => slot.id === Number(slotId));

export const getReviewSlotTime = (slotId) => getReviewSlot(slotId)?.time || 'Chưa xác định';

export const getReviewSlotLabel = (slotId) => {
  const slot = getReviewSlot(slotId);
  return slot ? `${slot.name} (${slot.time})` : `Slot ${slotId || '?'}`;
};
