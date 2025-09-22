// backend/middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (relaxed for testing)
  max: 20, // Max 20 attempts per 15 minutes (relaxed for testing)
  message: { message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter
};
