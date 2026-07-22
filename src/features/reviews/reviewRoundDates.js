const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value) => {
  if (!DATE_ONLY_PATTERN.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

export const addDateOnlyDays = (value, days) => {
  const date = parseDateOnly(value);
  if (!date) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
};

export const calculateReviewDates = (registrationEndDate) => ({
  weekStartDate: addDateOnlyDays(registrationEndDate, 5),
  weekEndDate: addDateOnlyDays(registrationEndDate, 10),
});

export const isWednesday = (value) => parseDateOnly(value)?.getUTCDay() === 3;

export const getRegistrationEndDate = (round) => round?.registrationEndDate
  || addDateOnlyDays(round?.weekStartDate, -5);
