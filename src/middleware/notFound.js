const { NotFoundError } = require('../errors/AppError');

// Runs only if no route matched. Passes a NotFoundError to the error middleware.
module.exports = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};
