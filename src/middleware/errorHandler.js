const { ZodError } = require('zod');

// THE one place where every error becomes an HTTP response.
// Response shape is always: { success:false, error:{ code, message, details? }, requestId }
// Stack traces and internal messages are written to the server log only, never to the client.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong. Please try again later.';
  let details;

  if (err && err.isOperational) {
    // Our own AppError subclasses: safe to show.
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    // A schema parsed outside the validate middleware.
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.issues.map((i) => ({
      location: 'unknown',
      field: i.path.join('.') || '(root)',
      message: i.message,
    }));
  } else if (err && err.type === 'entity.parse.failed') {
    // express.json() received malformed JSON.
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err && err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  // Log full details for developers (server side only).
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${req.id}] ${req.method} ${req.originalUrl} -> ${status} ${code}`);
    if (status >= 500) console.error(err && err.stack ? err.stack : err);
  }

  const body = { success: false, error: { code, message }, requestId: req.id };
  if (details) body.error.details = details;
  res.status(status).json(body);
};

module.exports = errorHandler;
