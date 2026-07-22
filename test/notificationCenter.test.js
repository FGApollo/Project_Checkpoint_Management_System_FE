import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const navbar = fs.readFileSync('src/components/common/Navbar.jsx', 'utf8');
const service = fs.readFileSync('src/services/notifications.js', 'utf8');

test('notification bell opens a database-backed notification center', () => {
  assert.match(navbar, /onClick=\{toggleNotifications\}/);
  assert.match(navbar, /aria-label="Danh sách thông báo"/);
  assert.match(navbar, /markAllNotificationsRead/);
  assert.match(navbar, /notification\.isRead/);
  assert.match(service, /api\.get\('\/notifications'/);
  assert.match(service, /api\.patch\(`\/notifications\/\$\{notificationId\}\/read`\)/);
  assert.match(service, /api\.patch\('\/notifications\/read-all'\)/);
});

test('notification badge represents the real unread count', () => {
  assert.match(navbar, /unreadCount > 0/);
  assert.doesNotMatch(navbar, /width: '8px',[\s\S]*height: '8px',[\s\S]*background: '#EF4444'/);
});
