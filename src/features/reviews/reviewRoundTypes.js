export const REVIEW_TYPES = Object.freeze(['Review1', 'Review2', 'Review3']);

export const normalizeReviewType = (value) => {
  if (value === 0 || value === '0') return 'Review1';
  if (value === 1 || value === '1') return 'Review2';
  if (value === 2 || value === '2') return 'Review3';
  return typeof value === 'string' ? value : '';
};

export const getExistingReviewTypes = (rounds = []) => new Set(
  rounds.map((round) => normalizeReviewType(round.type)).filter(Boolean)
);

export const getAvailableReviewTypes = (rounds = []) => {
  const existing = getExistingReviewTypes(rounds);
  return REVIEW_TYPES.filter((type) => !existing.has(type));
};

export const getDuplicateReviewTypes = (rounds = []) => {
  const counts = new Map();
  rounds.forEach((round) => {
    const type = normalizeReviewType(round.type);
    if (type) counts.set(type, (counts.get(type) || 0) + 1);
  });
  return REVIEW_TYPES.filter((type) => (counts.get(type) || 0) > 1);
};
