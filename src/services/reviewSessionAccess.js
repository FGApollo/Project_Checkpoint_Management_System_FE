import api from './api';

export const generateReviewSessionAccessCode = (sessionId) =>
  api.post(`/review-sessions/${sessionId}/access-code`);

export const verifyReviewSessionAccessCode = (sessionId, accessCode) =>
  api.post(`/review-sessions/${sessionId}/access-code/verify`, { accessCode });
