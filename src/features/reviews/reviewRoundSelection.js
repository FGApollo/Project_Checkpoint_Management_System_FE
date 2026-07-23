import { getReviewDateKey } from './reviewSessionDates.js';

const getRoundStart = (round) => String(round?.weekStartDate || '').slice(0, 10);
const getRoundEnd = (round) => String(round?.weekEndDate || round?.weekStartDate || '').slice(0, 10);

export const selectRelevantReviewRound = (rounds, referenceDate = new Date()) => {
  if (!Array.isArray(rounds) || rounds.length === 0) return null;

  const today = getReviewDateKey(referenceDate);
  if (!today) return rounds[0];

  const scheduledRounds = rounds.filter((round) => getRoundStart(round));
  const current = scheduledRounds.find((round) =>
    getRoundStart(round) <= today && today <= getRoundEnd(round));
  if (current) return current;

  const next = scheduledRounds
    .filter((round) => getRoundStart(round) > today)
    .sort((left, right) => getRoundStart(left).localeCompare(getRoundStart(right)))[0];
  if (next) return next;

  return scheduledRounds
    .sort((left, right) => getRoundEnd(right).localeCompare(getRoundEnd(left)))[0]
    || rounds[0];
};
