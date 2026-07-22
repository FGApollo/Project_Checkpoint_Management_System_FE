import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('student has an irreversible self check-in tab backed by API', async () => {
  const [page, app, sidebar, lecturer] = await Promise.all([
    readSource('../src/pages/student/StudentCheckInPage.jsx'),
    readSource('../src/App.jsx'),
    readSource('../src/components/common/Sidebar.jsx'),
    readSource('../src/pages/lecturer/ReviewScoringPage.jsx'),
  ]);

  assert.match(page, /api\.get\('\/student-review\/check-ins'\)/);
  assert.match(page, /api\.post\(`\/student-review\/check-ins\/\$\{session\.sessionId\}`\)/);
  assert.match(page, /type="checkbox"/);
  assert.match(page, /checked=\{confirmed\}/);
  assert.match(page, /disabled=\{confirmed \|\| !session\.canConfirm \|\| busy\}/);
  assert.match(app, /path="\/student\/check-in"/);
  assert.match(sidebar, /Ký xác nhận tham dự/);
  assert.match(lecturer, /studentConfirmedAt/);
  assert.match(page, /Không ký — Vắng mặt/);
  assert.doesNotMatch(page, /score|pass|fail/i);
});
