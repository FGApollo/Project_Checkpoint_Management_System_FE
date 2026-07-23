import api from './api';

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.items) ? payload.items : [];
};

export const loadDefenseManagementWorkspace = async () => {
  const semesterResponse = await api.get('/semesters/resolve');
  const semester = semesterResponse.data;
  if (!semester?.id) {
    return { semester: null, rounds: [], boards: [], sessions: [], lecturers: [], groups: [] };
  }

  const [roundsResponse, boardsResponse, sessionsResponse, reviewRoundsResponse] = await Promise.all([
    api.get('/defense-management/rounds', {
      params: { page: 1, pageSize: 100, filterBy: 'semesterId', filterValue: semester.id },
    }),
    api.get('/defense-management/boards', { params: { semesterId: semester.id } }),
    api.get('/defense-sessions', { params: { semesterId: semester.id } }),
    api.get('/review-scheduling/rounds', { params: { semesterId: semester.id } }),
  ]);

  const reviewRound = asList(reviewRoundsResponse.data)[0];
  let lecturers = [];
  let groups = [];
  if (reviewRound) {
    const boardResponse = await api.get('/review-scheduling/board', {
      params: {
        semesterId: semester.id,
        reviewType: reviewRound.type,
        weekStart: reviewRound.weekStartDate,
      },
    });
    lecturers = asList(boardResponse.data?.lecturers);
    groups = asList(boardResponse.data?.groups);
  }

  return {
    semester,
    rounds: asList(roundsResponse.data),
    boards: asList(boardsResponse.data),
    sessions: asList(sessionsResponse.data),
    lecturers,
    groups,
  };
};

export const listDefenseBoards = async (semesterId) => {
  const response = await api.get('/defense-management/boards', { params: { semesterId } });
  return asList(response.data);
};
