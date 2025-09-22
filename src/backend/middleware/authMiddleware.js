const jwt = require('jsonwebtoken');
const sessionService = require('../services/sessionService');

const authMiddleware = async (req, res, next) => {
  let token;

  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    // Check cookie if no header
    token = req.cookies?.authToken;
  }

  console.log('🔍 Auth Middleware Debug:');
  console.log('📡 Auth Header:', authHeader);
  console.log('🍪 Cookies:', req.cookies);
  console.log('🔑 Token found:', token ? 'Yes' : 'No');

  if (!token) {
    console.log('❌ No token found');
    return res.status(401).json({ message: 'Authorization token missing or invalid' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);

    // Check if session is active
    const activeSessions = await sessionService.findActiveSessionsByUser(decoded.userId);
    console.log('🔍 Active sessions found:', activeSessions.length);

    const currentSession = activeSessions.find(session => session.token === token);
    console.log('🔍 Current session found:', currentSession ? 'Yes' : 'No');

    if (!currentSession) {
      console.log('❌ Session not active');
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    req.user = decoded;
    console.log('✅ Authentication successful');
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
