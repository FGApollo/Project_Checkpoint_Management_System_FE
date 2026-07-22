import test from 'node:test';
import assert from 'node:assert/strict';
import { uniquePresenceMembers } from '../src/services/presenceUtils.js';
import { readFile } from 'node:fs/promises';

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

test('presence indicator is an expandable bottom-left user list', async () => {
  const navbar = await readFile(new URL('../src/components/common/Navbar.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/App.css', import.meta.url), 'utf8');
  const header = navbar.slice(navbar.indexOf('return ('), navbar.indexOf('</header>'));

  assert.match(navbar, /className="presence-indicator"/);
  assert.match(navbar, /className="presence-list"/);
  assert.match(navbar, /onlineMembers\.map/);
  assert.match(styles, /\.presence-widget\s*\{[\s\S]*position:\s*fixed[\s\S]*left:\s*1rem[\s\S]*bottom:\s*1rem/);
  assert.doesNotMatch(header, /onlineMembers|<Wifi/);
});
