const { z, str } = require('./helpers');

// Roll number format used in this college, for example 24WU0101090.
const ROLL_NUMBER = /^\d{2}WU\d{7}$/;

const registerBody = z
  .object({
    name: str('name')
      .trim()
      .min(2, 'name must be at least 2 characters')
      .max(60, 'name must be at most 60 characters'),
    email: str('email')
      .trim()
      .toLowerCase()
      .email('email must be a valid email address'),
    rollNumber: str('rollNumber')
      .trim()
      .toUpperCase()
      .regex(ROLL_NUMBER, 'rollNumber must look like 24WU0101090'),
    password: str('password')
      .min(8, 'password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'password must contain a letter')
      .regex(/\d/, 'password must contain a number'),
  })
  .strict(); // unknown keys (for example isAdmin) are rejected, not silently ignored

module.exports = { registerBody };
