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
    '../src/pages/student/StudentDashboard.jsx',
    '../src/pages/student/ReviewRegistrationPage.jsx',
    '../src/pages/student/ReviewResultsPage.jsx',
    '../src/pages/student/StudentCheckInPage.jsx',
  ];

  const sources = await Promise.all(pagePaths.map(readSource));
  sources.forEach((source, index) => {
    assert.match(source, /components\/common\/Skeleton/, `${pagePaths[index]} must import shared skeleton UI`);
    assert.match(source, /PageSkeleton|PanelSkeleton|TableSkeletonRows/, `${pagePaths[index]} must render a skeleton`);
    assert.match(
      source,
      /finally\s*\{[\s\S]*?set(?:Initial)?Loading\(false\)/,
      `${pagePaths[index]} must release its loading state in finally`,
    );
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
  assert.match(styles, /skeleton-pulse/);
  assert.doesNotMatch(styles, /background-position/);
  assert.match(component, /Máy chủ đang phản hồi chậm/);
  assert.doesNotMatch(app, /PageSkeleton/);
  assert.match(app, /if \(loading\) return null/);
});

test('API requests have a finite deadline so skeletons cannot wait forever', async () => {
  const [apiModule, apiSource] = await Promise.all([
    import('../src/services/api.js'),
    readSource('../src/services/api.js'),
  ]);

  assert.ok(
    Number.isFinite(apiModule.default.defaults.timeout),
    'Axios must define a finite timeout',
  );
  assert.ok(
    apiModule.default.defaults.timeout >= 10_000 && apiModule.default.defaults.timeout <= 60_000,
    'API timeout must be long enough for Render cold starts but bounded to 60 seconds',
  );
  assert.match(
    apiSource,
    /axios\.post\([\s\S]*?\{\s*timeout:\s*API_REQUEST_TIMEOUT_MS\s*\},?\s*\)/,
    'Token refresh must use the same finite deadline',
  );
  const { createServer } = await import('node:http');
  const server = createServer(() => {});
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const previousTimeout = apiModule.default.defaults.timeout;
  globalThis.localStorage ??= { getItem: () => null };
  apiModule.default.defaults.timeout = 75;
  const startedAt = Date.now();
  try {
    await assert.rejects(
      apiModule.default.get(`http://127.0.0.1:${address.port}/never-responds`),
      (error) => error.code === 'ECONNABORTED' || /timeout/i.test(error.message),
      'A request that never responds must be aborted',
    );
    assert.ok(Date.now() - startedAt < 1_000, 'The timeout feedback loop must finish quickly');
  } finally {
    apiModule.default.defaults.timeout = previousTimeout;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
