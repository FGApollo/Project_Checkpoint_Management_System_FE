export const REVIEW_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: REVIEW_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const getReviewDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(
    dateKeyFormatter.formatToParts(date).map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const getUtcDayNumber = (dateKey) => {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  if (![year, month, day].every(Number.isInteger)) return null;
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
};

export const getDaysUntilReview = (sessionDate, referenceDate = new Date()) => {
  const sessionDay = getUtcDayNumber(getReviewDateKey(sessionDate));
  const referenceDay = getUtcDayNumber(getReviewDateKey(referenceDate));
  return sessionDay === null || referenceDay === null ? null : sessionDay - referenceDay;
};

export const getReviewReminder = (sessionDate, referenceDate = new Date()) => {
  const daysUntil = getDaysUntilReview(sessionDate, referenceDate);
  if (daysUntil === 0) return 'Hôm nay';
  if (daysUntil === 1) return 'Ngày mai';
  if (daysUntil > 1) return `Còn ${daysUntil} ngày`;
  return null;
};

export const filterReviewSessions = (sessions, filter, referenceDate = new Date()) => {
  if (filter === 'all') return sessions;

  return sessions.filter((session) => {
    const daysUntil = getDaysUntilReview(session.sessionDate, referenceDate);
    if (filter === 'today') return daysUntil === 0;
    if (filter === 'upcoming') return daysUntil !== null && daysUntil > 0;
    return false;
  });
};
