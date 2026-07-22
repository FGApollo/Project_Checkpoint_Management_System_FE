import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('student UI describes the workflow only as three review rounds', async () => {
  const dashboard = await readFile(new URL('../src/pages/student/StudentDashboard.jsx', import.meta.url), 'utf8');

  assert.match(dashboard, /Review 1, Review 2 và Review 3/);
  assert.match(dashboard, /value="Review1">Review 1/);
  assert.match(dashboard, /value="Review2">Review 2/);
  assert.match(dashboard, /value="Review3">Review 3/);
  assert.doesNotMatch(dashboard, /Báo cáo đề cương|Giữa kỳ|Bảo vệ thử|value="Proposal"|value="Progress"|value="Final"/);
});
