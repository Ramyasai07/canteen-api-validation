// In-memory data so the assignment needs no database.
const menu = [
  { id: 1, name: 'Idli (2 pcs)', category: 'Breakfast', price: 30, available: true },
  { id: 2, name: 'Veg Meals', category: 'Meals', price: 80, available: true },
  { id: 3, name: 'Samosa', category: 'Snacks', price: 15, available: true },
  { id: 4, name: 'Masala Tea', category: 'Beverages', price: 12, available: true },
  { id: 5, name: 'Chicken Biryani', category: 'Meals', price: 120, available: false }, // sold out
];
const users = [];
const orders = [];
const reset = () => { users.length = 0; orders.length = 0; };
module.exports = { menu, users, orders, reset };
