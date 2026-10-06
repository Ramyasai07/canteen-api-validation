const { randomUUID } = require('crypto');

// Gives every request an id so a client error report can be matched to a server log line.
module.exports = (req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};
