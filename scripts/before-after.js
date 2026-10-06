// Sends the SAME 6 bad requests to the naive app (before) and to the final app (after)
// and prints what each one returns. Run with: npm run before-after
process.env.NODE_ENV = 'test';
process.env.ENABLE_DEMO_ROUTES = 'true';
const createNaiveApp = require('../examples/naive-app');
const createApp = require('../src/app');

const cases = [
  { id: 'B1', name: 'Register: bad email + 1-char password', method: 'POST', path: '/api/auth/register', body: '{"name":"A","email":"x","rollNumber":"bad","password":"1"}', invalid: true },
  { id: 'B2', name: 'Register: malformed JSON', method: 'POST', path: '/api/auth/register', body: '{"name": "Ramya", ', invalid: true },
  { id: 'B3', name: 'Menu item: id = abc', method: 'GET', path: '/api/menu/abc', invalid: true },
  { id: 'B4', name: 'Order: empty items, no slot', method: 'POST', path: '/api/orders', body: '{"items":[]}', invalid: true },
  { id: 'B5', name: 'Unknown route', method: 'GET', path: '/api/nothing-here', invalid: true },
  { id: 'B6', name: 'Server bug (TypeError)', method: 'GET', path: '/api/demo/crash', invalid: false },
];

async function run(app) {
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://localhost:${server.address().port}`;
  const out = [];
  for (const c of cases) {
    const res = await fetch(base + c.path, { method: c.method, headers: c.body ? { 'Content-Type': 'application/json' } : {}, body: c.body });
    const text = await res.text();
    const type = res.headers.get('content-type') || '';
    out.push({
      id: c.id,
      status: res.status,
      json: /application\/json/.test(type),
      stack: /node_modules|\.js:\d+|\sat\s.+\(/.test(text),
      accepted: c.invalid && res.status >= 200 && res.status < 300,
    });
  }
  server.close();
  return out;
}

(async () => {
  const before = await run(createNaiveApp());
  const after = await run(createApp());
  console.log('ID  | Request                                | BEFORE: status json stack accepted | AFTER: status json stack accepted');
  console.log('----+----------------------------------------+------------------------------------+----------------------------------');
  cases.forEach((c, i) => {
    const b = before[i], a = after[i];
    const f = (x) => `${String(x.status).padEnd(6)} ${String(x.json).padEnd(5)} ${String(x.stack).padEnd(5)} ${String(x.accepted).padEnd(8)}`;
    console.log(`${c.id.padEnd(3)} | ${c.name.padEnd(38)} | ${f(b)}      | ${f(a)}`);
  });
  const sum = (arr, k) => arr.filter((x) => x[k]).length;
  console.log('\nSummary (out of 6 requests)');
  console.log(`JSON error/response   : before ${sum(before, 'json')}/6   after ${sum(after, 'json')}/6`);
  console.log(`Stack trace leaked    : before ${sum(before, 'stack')}/6   after ${sum(after, 'stack')}/6`);
  console.log(`Invalid input accepted: before ${sum(before, 'accepted')}/5   after ${sum(after, 'accepted')}/5`);
})();
