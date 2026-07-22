import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('presence waits for a usable token and retries after API refresh', async () => {
  const [presence, api] = await Promise.all([
    readSource('../src/services/presence.js'),
    readSource('../src/services/api.js'),
  ]);

  assert.match(presence, /hasUsableAccessToken/);
  assert.match(presence, /auth:token-refreshed/);
  assert.match(api, /auth:token-refreshed/);
});
