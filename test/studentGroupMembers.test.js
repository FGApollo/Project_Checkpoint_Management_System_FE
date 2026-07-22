import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('student dashboard lists group members with realtime online state', async () => {
  const dashboard = await readSource('../src/pages/student/StudentDashboard.jsx');

  assert.match(dashboard, /\/semesters\/\$\{semester\.id\}\/groups/);
  assert.match(dashboard, /ownGroup\?\.members/);
  assert.match(dashboard, /presenceService\.subscribe\(setOnlineMembers\)/);
  assert.match(dashboard, /onlineUserIds\.has\(String\(member\.userId\)\)/);
  assert.match(dashboard, /Thành viên nhóm/);
});
