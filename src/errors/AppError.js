// Custom error classes. Every error we throw on purpose extends AppError,
// so the central error middleware can tell "expected" errors from bugs.
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // expected, safe-to-show error
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(details, message = 'Request validation failed') {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Request conflicts with current state') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = { AppError, ValidationError, UnauthorizedError, NotFoundError, ConflictError };
