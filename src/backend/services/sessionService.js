// backend/services/sessionService.js

const Session = require('../models/Session');
const UAParser = require('ua-parser-js');

// Create a new session with IP, location, and device info
const createSession = async ({ userId, token, ip, location, userAgent }) => {
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  const device = {
    userAgent,
    browser: uaResult.browser.name,
    os: uaResult.os.name,
    isMobile: uaResult.device.type === 'mobile',
    isDesktop: uaResult.device.type === 'desktop' || !uaResult.device.type
  };

  const session = new Session({
    userId,
    token,
    loginTime: new Date(),
    isActive: true,
    ip,
    location,
    device
  });

  await session.save();
  return session;
};

// Deactivate an active session
const deactivateSession = async (token) => {
  const session = await Session.findOne({ token });

  if (!session) return false;         // Session not found
  if (!session.isActive) return false; // Already inactive

  session.isActive = false;
  await session.save();
  return true; // Deactivation successful
};

// Get all active sessions for a user
const findActiveSessionsByUser = async (userId) => {
  return await Session.find({ userId, isActive: true });
};

module.exports = {
  createSession,
  deactivateSession,
  findActiveSessionsByUser,
};
