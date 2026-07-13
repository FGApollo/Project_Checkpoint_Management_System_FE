export const ROUND_STATUS = Object.freeze({
  DRAFT: 'Draft',
  OPEN: 'Open',
  CLOSED: 'Closed',
  PUBLISHED: 'Published',
});

export const REQUIRED_STUDENT_AVAILABILITY_SLOTS = 5;
export const MAX_GROUPS_PER_REVIEW_SLOT = 3;

export const isRegistrationOpen = (status) => status === ROUND_STATUS.OPEN;

export const getStudentAvailabilityValidationError = (slots) => {
  if (!Array.isArray(slots)) return 'Danh sách slot không hợp lệ.';

  const normalizedKeys = new Set();
  for (const item of slots) {
    const dayOfWeek = Number(item?.dayOfWeek);
    const slot = Number(item?.slot);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 6) {
      return 'Ngày đăng ký phải nằm trong khoảng Thứ Hai đến Thứ Bảy.';
    }
    if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
      return 'Ca đăng ký phải nằm trong khoảng 1 đến 5.';
    }
    normalizedKeys.add(`${dayOfWeek}:${slot}`);
  }

  if (normalizedKeys.size !== slots.length) return 'Danh sách đăng ký có slot bị trùng.';
  if (slots.length !== REQUIRED_STUDENT_AVAILABILITY_SLOTS) {
    return `Mỗi nhóm phải chọn đúng ${REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot rảnh.`;
  }
  return null;
};

export const getReviewSlotCapacityViolations = (sessions) => {
  if (!Array.isArray(sessions)) return [];

  const sessionsBySlot = new Map();
  for (const session of sessions) {
    const dayOfWeek = Number(session?.dayOfWeek);
    const slot = Number(session?.slot);
    if (!Number.isInteger(dayOfWeek) || !Number.isInteger(slot)) continue;
    const key = `${dayOfWeek}:${slot}`;
    const groupKey = session?.groupId ?? session?.groupCode ?? session?.id;
    if (groupKey == null) continue;
    if (!sessionsBySlot.has(key)) sessionsBySlot.set(key, new Set());
    sessionsBySlot.get(key).add(String(groupKey));
  }

  return [...sessionsBySlot.entries()]
    .filter(([, groupKeys]) => groupKeys.size > MAX_GROUPS_PER_REVIEW_SLOT)
    .map(([key, groupKeys]) => {
      const [dayOfWeek, slot] = key.split(':').map(Number);
      return { dayOfWeek, slot, groupCount: groupKeys.size };
    });
};

export const getRoundStatusMeta = (status) => {
  switch (status) {
    case ROUND_STATUS.OPEN:
      return { label: 'Đang mở đăng ký', background: '#DCFCE7', color: '#15803D' };
    case ROUND_STATUS.CLOSED:
      return { label: 'Đã khóa đăng ký', background: '#FEF3C7', color: '#B45309' };
    case ROUND_STATUS.PUBLISHED:
      return { label: 'Đã công bố lịch', background: '#DBEAFE', color: '#1D4ED8' };
    case ROUND_STATUS.DRAFT:
    default:
      return { label: 'Bản nháp', background: '#F1F5F9', color: '#475569' };
  }
};
