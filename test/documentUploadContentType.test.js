import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('the shared API client lets Axios choose the multipart boundary for FormData uploads', async () => {
  const apiSource = await readFile(new URL('../src/services/api.js', import.meta.url), 'utf8');
  const documentsSource = await readFile(new URL('../src/services/documents.js', import.meta.url), 'utf8');

  assert.doesNotMatch(
    apiSource,
    /headers:\s*\{\s*['"]Content-Type['"]:\s*['"]application\/json['"]/,
    'A global JSON content type overrides the multipart boundary required by /api/documents.',
  );
  assert.match(documentsSource, /new FormData\(\)/);
  assert.match(documentsSource, /form\.append\(['"]groupId['"]/);
  assert.match(documentsSource, /form\.append\(['"]file['"]/);
});
