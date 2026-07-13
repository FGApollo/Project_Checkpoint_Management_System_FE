import {
  getStudentAvailabilityValidationError,
  REQUIRED_STUDENT_AVAILABILITY_SLOTS,
} from './reviewDomain.js';

export const getOwnRegistrations = (gridData, knownGroupId) => {
  const currentAvailability = Array.isArray(gridData?.myAvailability) ? gridData.myAvailability : [];
  const registrations = Array.isArray(gridData?.registrations) ? gridData.registrations : [];
  const explicitRegistrations = Array.isArray(gridData?.myRegistrations) ? gridData.myRegistrations : [];
  const singleRegistration = gridData?.myRegistration || null;
  const detectedGroupId = currentAvailability[0]?.groupId
    || explicitRegistrations[0]?.groupId
    || singleRegistration?.groupId
    || knownGroupId;
  const registrationsForGroup = detectedGroupId
    ? registrations.filter((registration) => Number(registration.groupId) === Number(detectedGroupId))
    : [];

  if (currentAvailability.length > 0) return currentAvailability;
  if (explicitRegistrations.length > 0) return explicitRegistrations;
  if (registrationsForGroup.length > 0) return registrationsForGroup;
  return singleRegistration ? [singleRegistration] : [];
};

const normalizeSlots = (slots) => slots.map(({ dayOfWeek, slot }) => ({
  dayOfWeek: Number(dayOfWeek),
  slot: Number(slot),
}));

const slotKey = ({ dayOfWeek, slot }) => `${Number(dayOfWeek)}:${Number(slot)}`;

const hasSameSlots = (actual, expected) => {
  if (actual.length !== expected.length) return false;
  const actualKeys = new Set(actual.map(slotKey));
  return expected.every((item) => actualKeys.has(slotKey(item)));
};

const readOwnRegistrations = async (apiClient, roundId, knownGroupId) => {
  const response = await apiClient.get(`/student-review/slots?roundId=${roundId}`);
  return getOwnRegistrations(response.data || {}, knownGroupId);
};

const ensurePersisted = async (apiClient, roundId, slots, knownGroupId) => {
  const savedSlots = await readOwnRegistrations(apiClient, roundId, knownGroupId);
  if (!hasSameSlots(savedSlots, slots)) {
    throw new Error(
      `Backend chỉ xác nhận ${savedSlots.length}/${REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot hoặc dữ liệu trả về không khớp.`
    );
  }
  return savedSlots;
};

export const replaceStudentAvailability = async (
  apiClient,
  { roundId, slots, knownGroupId = null }
) => {
  const numericRoundId = Number(roundId);
  if (!Number.isInteger(numericRoundId) || numericRoundId <= 0) {
    throw new Error('Đợt review không hợp lệ.');
  }

  const normalizedSlots = normalizeSlots(slots);
  const validationError = getStudentAvailabilityValidationError(normalizedSlots);
  if (validationError) throw new Error(validationError);

  await apiClient.put('/student-review/slots', {
    roundId: numericRoundId,
    slots: normalizedSlots,
  });

  const savedSlots = await ensurePersisted(apiClient, numericRoundId, normalizedSlots, knownGroupId);
  return { savedSlots, persistenceMode: 'transactional' };
};
