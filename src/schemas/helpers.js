const { z } = require('zod');

// Small helpers so every field gets clear, human-readable messages.
const str = (name) => z.string({ required_error: `${name} is required`, invalid_type_error: `${name} must be a string` });
const num = (name) => z.number({ required_error: `${name} is required`, invalid_type_error: `${name} must be a number` });

module.exports = { z, str, num };
