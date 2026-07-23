export const slotRegistrationKey = (dayOfWeek, slot) =>
  `${Number(dayOfWeek)}-${Number(slot)}`;

export const buildSlotRegistrationCountMap = (counts) => {
  if (!Array.isArray(counts)) return {};

  return counts.reduce((result, item) => {
    const dayOfWeek = Number(item?.dayOfWeek);
    const slot = Number(item?.slot);
    const registeredCount = Math.max(0, Number(item?.registeredCount) || 0);
    if (dayOfWeek >= 1 && dayOfWeek <= 6 && slot >= 1 && slot <= 5) {
      result[slotRegistrationKey(dayOfWeek, slot)] = registeredCount;
    }
    return result;
  }, {});
};

export const getSlotRegistrationCount = (countMap, dayOfWeek, slot) =>
  countMap?.[slotRegistrationKey(dayOfWeek, slot)] || 0;

export const isSlotRegistrationFull = (count, capacity) =>
  Number(capacity) > 0 && Number(count) >= Number(capacity);

export const isSlotRegistrationDisabled = ({
  selected,
  registeredByCurrentUser = false,
  registeredCount,
  capacity,
  disabled = false,
}) => Boolean(
  disabled || (
    isSlotRegistrationFull(registeredCount, capacity) &&
    !selected &&
    !registeredByCurrentUser
  ),
);
