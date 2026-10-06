const express = require('express');
const { scryptSync, randomBytes } = require('crypto');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { ConflictError, NotFoundError } = require('../errors/AppError');
const { registerBody } = require('../schemas/auth.schema');
const { listQuery, idParams } = require('../schemas/menu.schema');
const { createOrderBody } = require('../schemas/order.schema');
const { menu, users, orders } = require('../data/store');

const router = express.Router();

// POST /api/auth/register  (validates body)
router.post('/auth/register', validate({ body: registerBody }), asyncHandler(async (req, res) => {
  const { name, email, rollNumber, password } = req.validated.body;
  if (users.some((u) => u.email === email || u.rollNumber === rollNumber)) {
    throw new ConflictError('A user with this email or roll number already exists');
  }
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 32).toString('hex');
  users.push({ id: users.length + 1, name, email, rollNumber, salt, passwordHash });
  res.status(201).json({ success: true, data: { id: users.length, name, email, rollNumber } }); // never return the password
}));

// GET /api/menu?category=&page=&limit=  (validates query)
router.get('/menu', validate({ query: listQuery }), (req, res) => {
  const { category, page, limit } = req.validated.query;
  const filtered = category ? menu.filter((m) => m.category === category) : menu;
  const start = (page - 1) * limit;
  res.json({ success: true, data: filtered.slice(start, start + limit), page, limit, total: filtered.length });
});

// GET /api/menu/:id  (validates params)
router.get('/menu/:id', validate({ params: idParams }), (req, res) => {
  const item = menu.find((m) => m.id === req.validated.params.id);
  if (!item) throw new NotFoundError(`Menu item ${req.validated.params.id} not found`);
  res.json({ success: true, data: item });
});

// POST /api/orders  (validates body, then business rules)
router.post('/orders', validate({ body: createOrderBody }), (req, res) => {
  const { items, pickupSlot, note } = req.validated.body;
  let total = 0;
  for (const line of items) {
    const item = menu.find((m) => m.id === line.menuItemId);
    if (!item) throw new NotFoundError(`Menu item ${line.menuItemId} not found`);
    if (!item.available) throw new ConflictError(`${item.name} is sold out`);
    total += item.price * line.quantity;
  }
  const order = { id: orders.length + 1, items, pickupSlot, note, total, status: 'PLACED' };
  orders.push(order);
  res.status(201).json({ success: true, data: order });
});

module.exports = router;
