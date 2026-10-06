// Test cases for invalid input and centralized error handling.
// Run with: npm test   (uses Node's built-in test runner, no extra packages)
process.env.NODE_ENV = 'test';
process.env.ENABLE_DEMO_ROUTES = 'true';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const store = require('../src/data/store');

let server, base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => store.reset());

async function call(method, path, body, raw) {
  const res = await fetch(base + path, {
    method,
    headers: body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, type: res.headers.get('content-type') || '', json, text };
}

const validUser = { name: 'P Ramya Sai', email: 'ramya@example.com', rollNumber: '24WU0101090', password: 'Canteen123' };
const fields = (r) => r.json.error.details.map((d) => d.field);

// Every error response must follow ONE shape.
function assertErrorShape(r, status, code) {
  assert.equal(r.status, status);
  assert.match(r.type, /application\/json/);
  assert.equal(r.json.success, false);
  assert.equal(r.json.error.code, code);
  assert.equal(typeof r.json.error.message, 'string');
  assert.equal(typeof r.json.requestId, 'string');
}

describe('POST /api/auth/register (body validation)', () => {
  it('TC01 valid registration returns 201 and hides the password', async () => {
    const r = await call('POST', '/api/auth/register', validUser);
    assert.equal(r.status, 201);
    assert.equal(r.json.data.rollNumber, '24WU0101090');
    assert.equal(r.json.data.password, undefined);
    assert.equal(r.json.data.passwordHash, undefined);
  });
  it('TC02 missing name returns 400 with field "name"', async () => {
    const { name, ...rest } = validUser;
    const r = await call('POST', '/api/auth/register', rest);
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.deepEqual(fields(r), ['name']);
    assert.equal(r.json.error.details[0].message, 'name is required');
  });
  it('TC03 invalid email returns 400', async () => {
    const r = await call('POST', '/api/auth/register', { ...validUser, email: 'ramya-at-example' });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.deepEqual(fields(r), ['email']);
  });
  it('TC04 weak password (short, no number) returns 400', async () => {
    const r = await call('POST', '/api/auth/register', { ...validUser, password: 'abc' });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.ok(fields(r).every((f) => f === 'password'));
    assert.ok(r.json.error.details.length >= 2);
  });
  it('TC05 wrong roll number format returns 400', async () => {
    const r = await call('POST', '/api/auth/register', { ...validUser, rollNumber: '12345' });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.deepEqual(fields(r), ['rollNumber']);
  });
  it('TC06 wrong data type (name as number) returns 400', async () => {
    const r = await call('POST', '/api/auth/register', { ...validUser, name: 12345 });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.equal(r.json.error.details[0].message, 'name must be a string');
  });
  it('TC07 unknown field "isAdmin" is rejected (mass-assignment protection)', async () => {
    const r = await call('POST', '/api/auth/register', { ...validUser, isAdmin: true });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.equal(store.users.length, 0);
  });
  it('TC08 several errors are reported together in one response', async () => {
    const r = await call('POST', '/api/auth/register', { name: 'A', email: 'x', rollNumber: 'bad', password: '1' });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.ok(new Set(fields(r)).size === 4);
  });
  it('TC09 duplicate registration returns 409 CONFLICT', async () => {
    await call('POST', '/api/auth/register', validUser);
    const r = await call('POST', '/api/auth/register', validUser);
    assertErrorShape(r, 409, 'CONFLICT');
  });
  it('TC10 malformed JSON returns 400 INVALID_JSON', async () => {
    const r = await call('POST', '/api/auth/register', undefined, '{"name": "Ramya", ');
    assertErrorShape(r, 400, 'INVALID_JSON');
    assert.ok(!/SyntaxError|at /.test(r.text));
  });
});

describe('GET /api/menu and /api/menu/:id (query and params validation)', () => {
  it('TC11 valid query is converted to numbers and applied', async () => {
    const r = await call('GET', '/api/menu?category=Meals&page=1&limit=1');
    assert.equal(r.status, 200);
    assert.equal(r.json.limit, 1);
    assert.equal(r.json.data.length, 1);
    assert.equal(r.json.total, 2);
  });
  it('TC12 invalid category returns 400', async () => {
    const r = await call('GET', '/api/menu?category=Pizza');
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.equal(r.json.error.details[0].location, 'query');
  });
  it('TC13 page=0 and limit=500 return two errors', async () => {
    const r = await call('GET', '/api/menu?page=0&limit=500');
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.deepEqual(fields(r).sort(), ['limit', 'page']);
  });
  it('TC14 non-numeric id param returns 400', async () => {
    const r = await call('GET', '/api/menu/abc');
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.equal(r.json.error.details[0].location, 'params');
  });
  it('TC15 valid but missing id returns 404 NOT_FOUND', async () => {
    const r = await call('GET', '/api/menu/999');
    assertErrorShape(r, 404, 'NOT_FOUND');
  });
});

describe('POST /api/orders (nested body validation)', () => {
  const order = { items: [{ menuItemId: 1, quantity: 2 }], pickupSlot: '12:30' };
  it('TC16 valid order returns 201 with calculated total', async () => {
    const r = await call('POST', '/api/orders', order);
    assert.equal(r.status, 201);
    assert.equal(r.json.data.total, 60);
  });
  it('TC17 empty items array returns 400', async () => {
    const r = await call('POST', '/api/orders', { ...order, items: [] });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.deepEqual(fields(r), ['items']);
  });
  it('TC18 quantity 0, negative, decimal and 11 are all rejected with exact paths', async () => {
    for (const q of [0, -3, 1.5, 11]) {
      const r = await call('POST', '/api/orders', { ...order, items: [{ menuItemId: 1, quantity: q }] });
      assertErrorShape(r, 400, 'VALIDATION_ERROR');
      assert.deepEqual(fields(r), ['items.0.quantity']);
    }
  });
  it('TC19 invalid pickup slot returns 400', async () => {
    const r = await call('POST', '/api/orders', { ...order, pickupSlot: '23:59' });
    assertErrorShape(r, 400, 'VALIDATION_ERROR');
    assert.deepEqual(fields(r), ['pickupSlot']);
  });
  it('TC20 sold-out item returns 409 CONFLICT', async () => {
    const r = await call('POST', '/api/orders', { ...order, items: [{ menuItemId: 5, quantity: 1 }] });
    assertErrorShape(r, 409, 'CONFLICT');
  });
});

describe('Centralized handling of routes and unexpected errors', () => {
  it('TC21 unknown route returns JSON 404 (not HTML)', async () => {
    const r = await call('GET', '/api/does-not-exist');
    assertErrorShape(r, 404, 'NOT_FOUND');
  });
  it('TC22 unexpected bug returns generic 500 and leaks no stack trace', async () => {
    const r = await call('GET', '/api/demo/crash');
    assertErrorShape(r, 500, 'INTERNAL_SERVER_ERROR');
    assert.equal(r.json.error.message, 'Something went wrong. Please try again later.');
    assert.equal(r.json.error.details, undefined);
    assert.ok(!/TypeError|node_modules|\.js:\d+|\sat\s|secret|stack/i.test(r.text), 'response must not leak internals');
  });
});
