import test from 'node:test';
import assert from 'node:assert/strict';
import { uniquePresenceMembers } from '../src/services/presenceUtils.js';

test('presence counts users instead of SignalR connections', () => {
  const members = [
    { userId: 12, connectionId: 'tab-1', displayName: 'Nguyễn Đức Minh', role: 'Lecturer' },
    { userId: 12, connectionId: 'tab-2', displayName: 'Nguyễn Đức Minh', role: 'Lecturer' },
    { userId: 20, connectionId: 'tab-3', displayName: 'SE193201', role: 'Student' },
  ];

  assert.deepEqual(
    uniquePresenceMembers(members).map((member) => member.connectionId),
    ['tab-1', 'tab-3'],
  );
});
