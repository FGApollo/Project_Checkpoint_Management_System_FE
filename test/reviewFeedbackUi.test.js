import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('review feedback UI does not expose scores or pass/fail verdicts', async () => {
  const [studentPage, lecturerPage, trackingPage, lecturerDashboard] = await Promise.all([
    readSource('../src/pages/student/ReviewResultsPage.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
    readSource('../src/pages/admin/ReviewTrackingPage.jsx'),
    readSource('../src/pages/lecturer/LecturerDashboard.jsx'),
  ]);

  assert.doesNotMatch(studentPage, /sub\.score|selectedSubmission\.result|getResultBadge/);
  assert.doesNotMatch(studentPage, /Điểm:\s*<strong>|KẾT QUẢ REVIEW|ĐẠT YÊU CẦU|KHÔNG ĐẠT/);
  assert.doesNotMatch(lecturerPage, /evalResult|resultText:\s*evalResult|Nộp Điểm|Chấm điểm/);
  assert.doesNotMatch(trackingPage, /scoringStatus|reviewer1Result|reviewer2Result|item\.result|Đạt yêu cầu \(Pass\)|Không đạt \(Fail\)|chấm điểm/i);
  assert.doesNotMatch(lecturerDashboard, /Chấm điểm Review/);
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
