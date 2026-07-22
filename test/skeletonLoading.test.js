import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('all API-backed pages render shared skeletons during initial loading', async () => {
  const pagePaths = [
    '../src/pages/admin/AdminDashboard.jsx',
    '../src/pages/admin/AccountsPage.jsx',
    '../src/pages/admin/SemesterManagementPage.jsx',
    '../src/pages/admin/ReviewManagementPage.jsx',
    '../src/pages/admin/ReviewTrackingPage.jsx',
    '../src/pages/admin/DefenseManagementPage.jsx',
    '../src/pages/admin/ExcelImportPage.jsx',
    '../src/pages/lecturer/LecturerDashboard.jsx',
    '../src/pages/lecturer/AvailabilityPage.jsx',
    '../src/pages/lecturer/ReviewScoringPage.jsx',
    '../src/pages/lecturer/DefenseRoomPage.jsx',
    '../src/pages/student/StudentDashboard.jsx',
    '../src/pages/student/ReviewRegistrationPage.jsx',
    '../src/pages/student/ReviewResultsPage.jsx',
    '../src/pages/student/StudentCheckInPage.jsx',
  ];

  const sources = await Promise.all(pagePaths.map(readSource));
  sources.forEach((source, index) => {
    assert.match(source, /components\/common\/Skeleton/, `${pagePaths[index]} must import shared skeleton UI`);
    assert.match(source, /PageSkeleton|PanelSkeleton|TableSkeletonRows/, `${pagePaths[index]} must render a skeleton`);
  });
});

test('skeleton UI is accessible and respects reduced motion', async () => {
  const [component, styles, app] = await Promise.all([
    readSource('../src/components/common/Skeleton.jsx'),
    readSource('../src/components/common/Skeleton.css'),
    readSource('../src/App.jsx'),
  ]);

  assert.match(component, /role="status"/);
  assert.match(component, /aria-label="Đang tải/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /skeleton-shimmer/);
  assert.match(app, /if \(loading\) return <PageSkeleton/);
});
