// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
  register,
  forgotPasswordRequest,
  resetPassword,
  loginChallenge,
  loginVerify,
  loginWithPassword,
  refresh,
  logout
} = require('../controllers/authController');

const { loginLimiter } = require('../middleware/rateLimiter'); 

// Auth routes
router.post('/register', register);
router.post('/forgot-password', forgotPasswordRequest);
router.post('/reset-password', resetPassword);
router.post('/login/challenge', loginLimiter, loginChallenge);
router.post('/login/verify', loginLimiter, loginVerify);
router.post('/login/password', loginLimiter, loginWithPassword);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
