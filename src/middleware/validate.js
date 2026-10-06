const { ValidationError } = require('../errors/AppError');

// validate({ params, query, body }) checks each part of the request with a Zod
// schema. All problems from all three parts are collected into ONE ValidationError.
// Cleaned (trimmed / converted / defaulted) data is stored in req.validated.
const validate = (schemas) => (req, res, next) => {
  const problems = [];
  req.validated = {};

  for (const location of ['params', 'query', 'body']) {
    const schema = schemas[location];
    if (!schema) continue;

    const result = schema.safeParse(req[location]);
    if (result.success) {
      req.validated[location] = result.data;
    } else {
      for (const issue of result.error.issues) {
        problems.push({
          location,
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        });
      }
    }
  }

  if (problems.length > 0) return next(new ValidationError(problems));
  next();
};

module.exports = validate;
