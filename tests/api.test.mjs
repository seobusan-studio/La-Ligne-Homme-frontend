import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source = await fs.readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
async function setup(status = 200) {
  const localStorage = storage();
  const sessionStorage = storage();
  const calls = [];
  const events = [];
  const context = vm.createContext({
    localStorage, sessionStorage, URL, Request, Headers, Date, Event,
    window: { location: { origin: 'https://shop.example.test' }, dispatchEvent: event => events.push(event.type) },
    fetch: async (input, init) => { calls.push({ input, init }); return new Response('{}', { status }); },
  });
  const module = new vm.SourceTextModule(javascript, {
    context, initializeImportMeta(meta) { meta.env = { VITE_API_URL: 'https://api.example.test/v1' }; },
  });
  await module.link(() => { throw new Error('Unexpected import'); });
  await module.evaluate();
  return { api: module.namespace, localStorage, sessionStorage, calls, events };
}
const valid = () => ({ id: 10, role: 'USER', accessToken: 'signed-test-token', expiresAt: Date.now() + 60000 });

test('legacy unsigned profile is removed rather than treated as a login', async () => {
  const { api, localStorage } = await setup();
  localStorage.setItem('laligne_session', JSON.stringify({ id: 1, role: 'ADMIN' }));
  assert.equal(api.readSession(), null);
  assert.equal(localStorage.getItem('laligne_session'), null);
});
test('signing in clears older sessions from the other storage', async () => {
  const { api, localStorage, sessionStorage } = await setup();
  localStorage.setItem('laligne_session', JSON.stringify(valid()));
  api.saveSession(valid(), false);
  assert.equal(localStorage.getItem('laligne_session'), null);
  assert.ok(sessionStorage.getItem('laligne_session'));
});
test('API receives the token and not spoofable identity headers', async () => {
  const { api, calls } = await setup();
  api.saveSession(valid(), false);
  await api.apiFetch('https://api.example.test/v1/api/carts', { headers: { 'X-User-Id': '999', 'X-Admin-Id': '1' } });
  assert.equal(calls[0].init.headers.get('Authorization'), 'Bearer signed-test-token');
  assert.equal(calls[0].init.headers.get('X-User-Id'), null);
  assert.equal(calls[0].init.headers.get('X-Admin-Id'), null);
  assert.equal(calls[0].init.credentials, 'omit');
});
test('token is never automatically sent to other origins or lookalike base paths', async () => {
  const { api, calls } = await setup();
  api.saveSession(valid(), true);
  await api.apiFetch('https://other.example.test/v1/api/orders');
  await api.apiFetch('https://api.example.test/v10/api/orders');
  assert.equal(calls[0].init.headers, undefined);
  assert.equal(calls[1].init.headers, undefined);
});
test('expired member session blocks a request instead of silently placing a guest order', async () => {
  const { api, calls, sessionStorage } = await setup();
  sessionStorage.setItem('laligne_session', JSON.stringify({ ...valid(), expiresAt: Date.now() - 1 }));
  await assert.rejects(api.apiFetch('https://api.example.test/v1/api/orders', { method: 'POST' }));
  assert.equal(calls.length, 0);
  assert.equal(sessionStorage.getItem('laligne_session'), null);
});
test('401 clears session and requests login without retrying a payment', async () => {
  const { api, calls, events } = await setup(401);
  api.saveSession(valid(), false);
  const response = await api.apiFetch('https://api.example.test/v1/api/payments/toss/confirm', { method: 'POST' });
  assert.equal(response.status, 401);
  assert.equal(api.readSession(), null);
  assert.deepEqual(events, ['auth-expired']);
  assert.equal(calls.length, 1);
});
test('403 retains login and does not retry', async () => {
  const { api, calls, events } = await setup(403);
  api.saveSession(valid(), false);
  await api.apiFetch('https://api.example.test/v1/api/admin/users');
  assert.ok(api.readSession());
  assert.equal(calls.length, 1);
  assert.deepEqual(events, []);
});
test('guest checkout remains possible without Authorization', async () => {
  const { api, calls } = await setup();
  await api.apiFetch('https://api.example.test/v1/api/orders', { method: 'POST', body: '{}' });
  assert.equal(calls[0].init.headers.get('Authorization'), null);
});
test('multipart body stays untouched and content-type boundary is left to the browser', async () => {
  const { api, calls } = await setup();
  api.saveSession(valid(), false);
  const body = new FormData();
  body.append('image', new Blob(['test']), 'image.png');
  await api.apiFetch('https://api.example.test/v1/api/banners/hero', { method: 'POST', body });
  assert.equal(calls[0].init.body, body);
  assert.equal(calls[0].init.headers.get('Content-Type'), null);
});
