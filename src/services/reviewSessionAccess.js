import api from './api';

export const generateReviewSessionAccessCode = (sessionId, groupId) =>
  api.post(`/review-sessions/${sessionId}/groups/${groupId}/access-code`);

export const verifyReviewSessionAccessCode = (sessionId, groupId, accessCode) =>
  api.post(`/review-sessions/${sessionId}/groups/${groupId}/access-code/verify`, { accessCode });
