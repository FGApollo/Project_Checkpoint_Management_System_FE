import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('review feedback UI does not expose scores or pass/fail verdicts', async () => {
  const [studentPage, studentDashboard, lecturerPage, trackingPage, lecturerDashboard] = await Promise.all([
    readSource('../src/pages/student/ReviewResultsPage.jsx'),
    readSource('../src/pages/student/StudentDashboard.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/pages/admin/ReviewTrackingPage.jsx'),
    readSource('../src/pages/lecturer/LecturerDashboard.jsx'),
  ]);

  assert.doesNotMatch(studentPage, /sub\.score|selectedSubmission\.result|getResultBadge/);
  assert.doesNotMatch(studentPage, /Điểm:\s*<strong>|KẾT QUẢ REVIEW|ĐẠT YÊU CẦU|KHÔNG ĐẠT/);
  assert.doesNotMatch(lecturerPage, /evalResult|resultText:\s*evalResult|Nộp Điểm|Chấm điểm/);
  assert.doesNotMatch(trackingPage, /scoringStatus|reviewer1Result|reviewer2Result|item\.result|Đạt yêu cầu \(Pass\)|Không đạt \(Fail\)|chấm điểm/i);
  assert.doesNotMatch(lecturerDashboard, /Chấm điểm Review/);
  assert.doesNotMatch(studentDashboard, /Kết quả Chấm|Nhóm #\$\{sc\.groupId\}/);
  assert.match(studentDashboard, /sc\.sessionId \|\| sc\.id/);
  assert.match(studentDashboard, /groupInfo\?\.groupCode/);
});

test('publishing a review schedule reports real email delivery counts', async () => {
  const managementPage = await readSource('../src/pages/admin/ReviewManagementPage.jsx');

  assert.match(managementPage, /queuedEmailCount/);
  assert.match(managementPage, /sentEmailCount/);
  assert.match(managementPage, /failedEmailCount/);
  assert.doesNotMatch(managementPage, /messageBody:/);
});

test('Google sign-in is wired from the login page through the auth context', async () => {
  const [loginPage, authContext] = await Promise.all([
    readSource('../src/pages/auth/LoginPage.jsx'),
    readSource('../src/context/AuthContext.jsx'),
  ]);

  assert.match(loginPage, /accounts\.google\.com\/gsi\/client/);
  assert.match(loginPage, /google\.accounts\.id\.initialize/);
  assert.match(authContext, /api\.post\('\/auth\/google'/);
});

test('lecturer can request AI review suggestions without score fields', async () => {
  const lecturerPage = await readSource('../src/pages/lecturer/ReviewScoringPage.jsx');
  assert.match(lecturerPage, /project-suggestions\/summary/);
  assert.match(lecturerPage, /Tạo gợi ý nhận xét bằng AI/);
  assert.match(lecturerPage, /contentSummary/);
  assert.match(lecturerPage, /improvementSummary/);
  assert.doesNotMatch(lecturerPage, /scoreValue|evalResult|resultText:\s*evalResult/);
});

test('students upload project documents and assigned lecturers can view them', async () => {
  const [studentPage, lecturerPage, documentService] = await Promise.all([
    readSource('../src/pages/student/StudentDashboard.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/services/documents.js'),
  ]);
  assert.match(studentPage, /uploadProjectDocument/);
  assert.match(studentPage, /\.pdf,\.docx,\.zip,\.txt/);
  assert.match(lecturerPage, /Tài liệu đồ án của nhóm/);
  assert.match(documentService, /FormData/);
  assert.match(documentService, /\/documents\/group\//);
  assert.match(documentService, /responseType: 'blob'/);
  assert.match(documentService, /documents\/\$\{id\}\/suggestions/);
  assert.match(lecturerPage, /generateProjectDocumentSuggestions/);
  assert.match(lecturerPage, /AI phân tích/);
});

test('lecturer review uses the deployed session contract and completes the group workflow', async () => {
  const lecturerPage = await readSource('../src/pages/lecturer/ReviewScoringPage.jsx');
  assert.match(lecturerPage, /id: item\.sessionId \?\? item\.id/);
  assert.match(lecturerPage, /params: \{ groupId: sess\.groupId \}/);
  assert.match(lecturerPage, /review-attendance\/\$\{selectedSession\.id\}\/groups\/\$\{selectedSession\.groupId\}\/complete/);
  assert.doesNotMatch(lecturerPage, /listProjectDocuments\(sess\.groupId\)/);
});

test('lecturer defense room is routed, database-backed, and production-safe', async () => {
  const [app, sidebar, defensePage, defenseManagementPage] = await Promise.all([
    readSource('../src/App.jsx'),
    readSource('../src/components/common/Sidebar.jsx'),
    readSource('../src/pages/lecturer/DefenseRoomPage.jsx'),
    readSource('../src/pages/admin/DefenseManagementPage.jsx'),
  ]);
  assert.match(app, /path="\/lecturer\/defenses"/);
  assert.match(sidebar, /to="\/lecturer\/defenses"/);
  assert.match(defensePage, /defense-management\/my-board-sessions/);
  assert.match(defenseManagementPage, /api\.get\('\/defense-sessions'\)/);
  assert.match(defensePage, /getBackendUrl/);
  assert.doesNotMatch(defensePage, /http:\/\/localhost:5122/);
  assert.doesNotMatch(defensePage, /SE190001|Nguyen Van A/);
});

test('admin can inspect semester groups and export all review reports', async () => {
  const [semesterPage, trackingPage, reviewManagementPage] = await Promise.all([
    readSource('../src/pages/admin/SemesterManagementPage.jsx'),
    readSource('../src/pages/admin/ReviewTrackingPage.jsx'),
    readSource('../src/pages/admin/ReviewManagementPage.jsx'),
  ]);
  assert.match(semesterPage, /semesters\/\$\{semester\.id\}\/groups/);
  assert.match(trackingPage, /review-submissions\/export\.zip/);
  assert.match(reviewManagementPage, /review-scheduling\/student-registrations/);
});
