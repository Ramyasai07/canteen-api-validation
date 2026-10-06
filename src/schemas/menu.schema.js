const { z } = require('zod');

const CATEGORIES = ['Breakfast', 'Meals', 'Snacks', 'Beverages'];

const listQuery = z
  .object({
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: `category must be one of: ${CATEGORIES.join(', ')}` }) }).optional(),
    page: z.coerce.number({ invalid_type_error: 'page must be a number' }).int('page must be a whole number').min(1, 'page must be at least 1').default(1),
    limit: z.coerce.number({ invalid_type_error: 'limit must be a number' }).int('limit must be a whole number').min(1, 'limit must be at least 1').max(50, 'limit must be at most 50').default(10),
  })
  .strict();

const idParams = z.object({
  id: z.coerce.number({ invalid_type_error: 'id must be a number' }).int('id must be a whole number').positive('id must be a positive number'),
});

module.exports = { listQuery, idParams, CATEGORIES };
