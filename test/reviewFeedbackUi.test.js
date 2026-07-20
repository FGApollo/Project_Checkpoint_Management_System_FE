import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('review feedback UI does not expose scores or pass/fail verdicts', async () => {
  const [studentPage, lecturerPage] = await Promise.all([
    readSource('../src/pages/student/ReviewResultsPage.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
  ]);

  assert.doesNotMatch(studentPage, /sub\.score|selectedSubmission\.result|getResultBadge/);
  assert.doesNotMatch(studentPage, /Điểm:\s*<strong>|KẾT QUẢ REVIEW|ĐẠT YÊU CẦU|KHÔNG ĐẠT/);
  assert.doesNotMatch(lecturerPage, /evalResult|resultText:\s*evalResult|Nộp Điểm|Chấm điểm/);
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
