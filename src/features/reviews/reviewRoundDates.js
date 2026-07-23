const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnly = (value) => {
  if (!DATE_ONLY_PATTERN.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateOnly = (date) => date.toISOString().slice(0, 10);
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const REVIEW_TARGET_RATIOS = [0.3, 0.6, 0.9];
const MINIMUM_REVIEW_SPACING_DAYS = 28;

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

export const getRegistrationStartDate = (round) =>
  round?.registrationStartDate
  || addDateOnlyDays(getRegistrationEndDate(round), -7);

const nearestMonday = (date) => {
  const result = new Date(date);
  const day = result.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const offset = daysSinceMonday <= 3 ? -daysSinceMonday : 7 - daysSinceMonday;
  result.setUTCDate(result.getUTCDate() + offset);
  return result;
};

const mondayOnOrBefore = (date) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - ((result.getUTCDay() + 6) % 7));
  return result;
};

export const calculateSemesterReviewPlan = (semester) => {
  const semesterStart = parseDateOnly(semester?.startDate);
  const semesterEnd = parseDateOnly(semester?.endDate);
  if (!semesterStart || !semesterEnd || semesterEnd <= semesterStart) return [];

  const durationDays = Math.round((semesterEnd - semesterStart) / DAY_IN_MS);
  const starts = REVIEW_TARGET_RATIOS.map((ratio) => {
    const target = new Date(semesterStart);
    target.setUTCDate(target.getUTCDate() + Math.round(durationDays * ratio));
    return nearestMonday(target);
  });

  for (let index = 1; index < starts.length; index += 1) {
    const spacing = Math.round((starts[index] - starts[index - 1]) / DAY_IN_MS);
    if (spacing < MINIMUM_REVIEW_SPACING_DAYS) {
      starts[index] = new Date(starts[index - 1]);
      starts[index].setUTCDate(starts[index].getUTCDate() + MINIMUM_REVIEW_SPACING_DAYS);
    }
  }

  const lastReviewEnd = new Date(starts[2]);
  lastReviewEnd.setUTCDate(lastReviewEnd.getUTCDate() + 5);
  if (lastReviewEnd > semesterEnd) {
    const latestStart = new Date(semesterEnd);
    latestStart.setUTCDate(latestStart.getUTCDate() - 5);
    starts[2] = mondayOnOrBefore(latestStart);
    starts[1] = new Date(starts[2]);
    starts[1].setUTCDate(starts[1].getUTCDate() - MINIMUM_REVIEW_SPACING_DAYS);
    starts[0] = new Date(starts[1]);
    starts[0].setUTCDate(starts[0].getUTCDate() - MINIMUM_REVIEW_SPACING_DAYS);
  }

  if (starts[0] < semesterStart) return [];

  return starts.map((start, index) => {
    const weekStartDate = formatDateOnly(start);
    return {
      reviewType: `Review${index + 1}`,
      registrationStartDate: addDateOnlyDays(weekStartDate, -12),
      registrationEndDate: addDateOnlyDays(weekStartDate, -5),
      weekStartDate,
      weekEndDate: addDateOnlyDays(weekStartDate, 5),
    };
  });
};
