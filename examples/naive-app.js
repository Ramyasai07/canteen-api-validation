// "BEFORE" version: how a beginner API often looks. No validation, no central error handling.
// Used only by scripts/before-after.js to measure the difference.
const express = require('express');

function createNaiveApp() {
  const app = express();
  const menu = [{ id: 1, name: 'Idli (2 pcs)', price: 30 }];
  const users = [];
  const orders = [];
  app.use(express.json());

  app.post('/api/auth/register', (req, res) => {
    const { name, email, rollNumber, password } = req.body;
    users.push({ name, email, rollNumber, password }); // stores whatever arrives, even plain-text passwords
    res.status(201).json({ ok: true, user: { name, email, rollNumber } });
  });
  app.get('/api/menu/:id', (req, res) => {
    const item = menu.find((m) => m.id === parseInt(req.params.id, 10));
    res.json({ name: item.name, price: item.price }); // crashes when item is undefined
  });
  app.post('/api/orders', (req, res) => {
    const total = (req.body.items || []).reduce((s, i) => s + i.quantity * 30, 0);
    orders.push(req.body);
    res.status(201).json({ ok: true, total });
  });
  app.get('/api/demo/crash', () => { const secret = null; return secret.value; });
  return app; // no notFound, no error middleware: Express default handler is used
}
module.exports = createNaiveApp;
