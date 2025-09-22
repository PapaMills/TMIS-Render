// backend/models/Session.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  ip: {
    type: String,
  },
  location: {
    city: String,
    country: String,
  },
  device: {
    userAgent: String,
    browser: String,
    os: String,
    isMobile: Boolean,
    isDesktop: Boolean,
  }
});

module.exports = mongoose.model('Session', sessionSchema);
