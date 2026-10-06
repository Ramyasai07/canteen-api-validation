const { z, str } = require('./helpers');

const SLOTS = ['12:00', '12:30', '13:00', '13:30'];

const orderItem = z
  .object({
    menuItemId: z.number({ required_error: 'menuItemId is required', invalid_type_error: 'menuItemId must be a number' }).int('menuItemId must be a whole number').positive('menuItemId must be positive'),
    quantity: z.number({ required_error: 'quantity is required', invalid_type_error: 'quantity must be a number' }).int('quantity must be a whole number').min(1, 'quantity must be at least 1').max(10, 'quantity must be at most 10'),
  })
  .strict();

const createOrderBody = z
  .object({
    items: z.array(orderItem, { required_error: 'items is required', invalid_type_error: 'items must be an array' }).min(1, 'items must contain at least one item').max(20, 'items must contain at most 20 items'),
    pickupSlot: z.enum(SLOTS, { errorMap: () => ({ message: `pickupSlot must be one of: ${SLOTS.join(', ')}` }) }),
    note: str('note').trim().max(100, 'note must be at most 100 characters').optional(),
  })
  .strict();

module.exports = { createOrderBody, SLOTS };
