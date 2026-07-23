import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('quick account switcher uses accounts with seeded workflow data', async () => {
  const loginPage = await readSource('../src/pages/auth/LoginPage.jsx');

  assert.match(loginPage, /handleQuickSelect\('pdt\.dieuphoi@fpt\.edu\.vn', 'Test@123456'\)/);
  assert.match(loginPage, /handleQuickSelect\('minhnd\.gv24001@fpt\.edu\.vn', 'Test@123456'\)/);
  assert.match(loginPage, /handleQuickSelect\('duongduy12314@gmail\.com', 'Test@123456'\)/);
  assert.doesNotMatch(loginPage, /handleQuickSelect\('test\.(training|lecturer|student)'/);
  assert.doesNotMatch(loginPage, /admin@gmail\.com|Qu?n tr? G?c|Qu?n tr? vi?n G?c|bootstrap-admin|bootstrapAdmin/);
});
