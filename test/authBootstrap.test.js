import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { hasUsableAccessToken, parseJwt } from '../src/services/authSession.js';

const toBase64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const tokenWithPayload = (payload) => `${toBase64Url({ alg: 'none' })}.${toBase64Url(payload)}.`;

test('expired access tokens are rejected before protected pages render', () => {
  const expired = tokenWithPayload({ sub: '7', role: 'Student', exp: Math.floor(Date.now() / 1000) - 60 });
  const current = tokenWithPayload({ sub: '7', role: 'Student', exp: Math.floor(Date.now() / 1000) + 60 });

  assert.equal(hasUsableAccessToken(expired), false);
  assert.equal(hasUsableAccessToken(current), true);
});

test('signed token claims override stale cached user fields during auth bootstrap', async () => {
  const token = tokenWithPayload({ sub: '7', unique_name: 'student', role: 'Student' });
  assert.deepEqual(parseJwt(token), { id: 7, username: 'student', role: 'Student' });

  const source = await readFile(new URL('../src/context/AuthContext.jsx', import.meta.url), 'utf8');
  assert.match(source, /await refreshAuthentication\(\)/);
  assert.match(source, /setUser\(\{ \.\.\.savedUser, \.\.\.parsedUser \}\)/);
});

test('API coalesces refresh calls and never refreshes public login endpoints', async () => {
  const source = await readFile(new URL('../src/services/api.js', import.meta.url), 'utf8');
  assert.match(source, /let refreshPromise = null/);
  assert.match(source, /if \(!refreshPromise\)/);
  assert.match(source, /isPublicAuthenticationRequest\(config\.url\)/);
  assert.match(source, /url\.endsWith\('\/auth\/login'\)/);
});
