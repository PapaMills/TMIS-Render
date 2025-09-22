// backend/controllers/authController.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sessionService = require('../services/sessionService');
const riskScoringService = require('../services/riskScoringService');
const { generateKeyPair, getKeyFromPublic, verifySignature } = require('../crypto/ecc');
const { generateNonce } = require('../crypto/nonce');
const logger = require('../utils/logger');
const getIPInfo = require('../utils/ipLookup'); // ✅ Import IP lookup utility
const UAParser = require('ua-parser-js');
const auditLogger = require('../services/auditLogger');

let nonceStore = {}; // In-memory nonce storage

// Registration
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, publicKey } = req.body;

    if (!firstName || !lastName || !email || !password || !publicKey) {
      return res.status(400).json({ message: 'All fields are required including publicKey' });
    }

    const username = `${firstName.trim()}.${lastName.trim()}`.toLowerCase();

    logger.info(`Register endpoint received publicKey: ${publicKey}`);

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      eccPublicKey: publicKey
    });

    await user.save();

    logger.info(`User registered: ${email}`);

    // Audit log registration event
    await auditLogger.logEvent('registration', user._id.toString(), email, req.ip);

    return res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    });
  } catch (err) {
    logger.error(`Registration error for ${req.body?.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Forgot Password - Request Reset
const forgotPasswordRequest = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // To prevent user enumeration, respond with success even if user not found
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent' });
    }

    // Generate reset token and expiration (e.g., 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save hashed token and expiry to user document
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // TODO: Send email with reset link containing token (e.g., https://yourdomain.com/reset-password?token=resetToken)
    // For now, just log the reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    logger.info(`Password reset link for ${email}: ${resetLink}`);

    return res.status(200).json({ message: 'If that email is registered, a reset link has been sent' });
  } catch (err) {
    logger.error(`Forgot password request error for ${req.body?.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for user ${user.email}`);

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    logger.error(`Reset password error: ${err.message}`);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};


// Step 1: Challenge
const loginChallenge = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const nonce = generateNonce();
    nonceStore[email] = nonce;

    const ip = req.headers['x-forwarded-for'] || req.ip;
    const ipInfo = await getIPInfo(ip);

    logger.info(`Challenge issued to ${email} from ${ipInfo.city || 'unknown'}, ${ipInfo.country || 'unknown'} (IP: ${ipInfo.ip})`);

    res.json({
      email,
      nonce,
      message: 'Sign this challenge with your private key'
    });
  } catch (err) {
    logger.error(`Challenge error for ${req.body?.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: 'Server error during challenge generation' });
  }
};

// Password-based login
const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.error(`Login failed: User not found for ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.error(`Login failed: Invalid password for ${email}`);
      return res.status(401).json({ message: 'Invalid password' });
    }

    const ip = req.headers['x-forwarded-for'] || req.ip;
    const ipInfo = await getIPInfo(ip);

    // Compute risk score (simplified for password login)
    const parser = new UAParser(req.headers['user-agent']);
    const uaResult = parser.getResult();

    const device = {
      userAgent: req.headers['user-agent'],
      browser: uaResult.browser.name || 'Unknown',
      os: uaResult.os.name || 'Unknown',
      isMobile: uaResult.device.type === 'mobile',
      isDesktop: uaResult.device.type === 'desktop' || !uaResult.device.type
    };

    const riskScore = riskScoringService.computeRiskScore(
      null, // no biometric
      device,
      { city: ipInfo.city, country: ipInfo.country },
      user._id.toString()
    );

    if (riskScoringService.shouldTriggerMFA(riskScore)) {
      logger.info(`Adaptive MFA triggered for ${email} with risk score ${riskScore}`);
      return res.status(403).json({
        message: 'Adaptive MFA required due to high risk score',
        riskScore
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, jti: crypto.randomUUID() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await sessionService.createSession({
      userId: user._id,
      token,
      ip: ipInfo.ip,
      location: {
        city: ipInfo.city,
        country: ipInfo.country
      },
      userAgent: req.headers['user-agent']
    });

    // Return token in response body instead of cookie
    // res.cookie('authToken', token, {
    //   httpOnly: true,
    //   secure: false, // Always false in development for localhost
    //   sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    //   maxAge: 3600000, // 1 hour
    //   path: '/', // Ensure cookie is available for all paths
    //   domain: 'localhost' // Set to localhost for development
    // });

    logger.info(`Password login successful for ${email} from ${ipInfo.city || 'unknown'}, ${ipInfo.country || 'unknown'} (IP: ${ipInfo.ip}) with risk score ${riskScore}`);

    // Audit log successful login
    await auditLogger.logEvent('login_success', user._id.toString(), email, ipInfo.ip, token, riskScore);

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token,
      riskScore
    });
  } catch (err) {
    logger.error(`Password login error for ${req.body?.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Step 2: Verify + Issue Token
const loginVerify = async (req, res) => {
  try {
    const { email, signature, biometricScore = null } = req.body; // biometricScore optional
    const nonce = nonceStore[email];
    if (!nonce) {
      logger.error(`Login failed: No nonce for ${email}`);
      return res.status(400).json({ message: 'Challenge expired or not found' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.error(`Login failed: User not found for ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const key = getKeyFromPublic(user.eccPublicKey);
    logger.info(`[DEBUG] Key type: ${typeof key}, has verify: ${typeof key.verify}`);
    logger.info(`[DEBUG] Nonce: ${nonce}`);
    logger.info(`[DEBUG] Signature length: ${signature.length}`);

    // Use the new verifySignature function for ECDSA verification
    const isValid = verifySignature(key, nonce, signature);

    if (!isValid) {
      logger.error(`Login failed: Invalid signature for ${email}`);
      return res.status(401).json({ message: 'Invalid signature' });
    }

    delete nonceStore[email];

    const ip = req.headers['x-forwarded-for'] || req.ip;
    const ipInfo = await getIPInfo(ip);

    // Compute risk score
    const parser = new UAParser(req.headers['user-agent']);
    const uaResult = parser.getResult();

    const device = {
      userAgent: req.headers['user-agent'],
      browser: uaResult.browser.name || 'Unknown',
      os: uaResult.os.name || 'Unknown',
      isMobile: uaResult.device.type === 'mobile',
      isDesktop: uaResult.device.type === 'desktop' || !uaResult.device.type
    };

    const riskScore = riskScoringService.computeRiskScore(
      biometricScore,
      device,
      { city: ipInfo.city, country: ipInfo.country },
      user._id.toString()
    );

    if (riskScoringService.shouldTriggerMFA(riskScore)) {
      logger.info(`Adaptive MFA triggered for ${email} with risk score ${riskScore}`);
      return res.status(403).json({
        message: 'Adaptive MFA required due to high risk score',
        riskScore
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, jti: crypto.randomUUID() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await sessionService.createSession({
      userId: user._id,
      token,
      ip: ipInfo.ip,
      location: {
        city: ipInfo.city,
        country: ipInfo.country
      },
      userAgent: req.headers['user-agent']
    });

    // Return token in response body instead of cookie
    // res.cookie('authToken', token, {
    //   httpOnly: true,
    //   secure: false, // Always false in development for localhost
    //   sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
    //   maxAge: 3600000, // 1 hour
    //   path: '/', // Ensure cookie is available for all paths
    //   domain: 'localhost' // Set to localhost for development
    // });

    logger.info(`Login successful for ${email} from ${ipInfo.city || 'unknown'}, ${ipInfo.country || 'unknown'} (IP: ${ipInfo.ip}) with risk score ${riskScore}`);

    // Audit log successful login
    await auditLogger.logEvent('login_success', user._id.toString(), email, ipInfo.ip, token, riskScore);

    return res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token,
      riskScore
    });
  } catch (err) {
    logger.error(`Login error for ${req.body?.email || 'unknown'}: ${err.message}`);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Refresh Token
const refresh = async (req, res) => {
  try {
    let token;

    // Get token from header or cookie
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies?.authToken;
    }

    if (!token) {
      logger.error('Refresh failed: No token provided');
      return res.status(400).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if session is active
    const activeSessions = await sessionService.findActiveSessionsByUser(userId);
    const currentSession = activeSessions.find(session => session.token === token);
    if (!currentSession) {
      logger.error(`Refresh failed: Session not active for user ${userId}`);
      return res.status(401).json({ message: 'Session expired or invalid' });
    }

    // Deactivate old session
    await sessionService.deactivateSession(token);

    // Issue new token
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, jti: crypto.randomUUID() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Create new session
    const ip = req.headers['x-forwarded-for'] || req.ip;
    const ipInfo = await getIPInfo(ip);

    await sessionService.createSession({
      userId,
      token: newToken,
      ip: ipInfo.ip,
      location: {
        city: ipInfo.city,
        country: ipInfo.country
      }
    });

    // Return token in response body instead of cookie for frontend compatibility
    logger.info(`Token refreshed for user ${decoded.email}`);

    // Audit log token refresh
    await auditLogger.logEvent('token_refresh', decoded.userId, decoded.email, req.ip, newToken);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (err) {
    logger.error(`Refresh error: ${err.message}`);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      logger.error('Logout failed: No token provided');
      return res.status(400).json({ message: 'No token provided' });
    }

    const success = await sessionService.deactivateSession(token);
    if (!success) {
      logger.error(`Logout failed: Session not found for token ${token}`);
      return res.status(404).json({ message: 'Session not found or already logged out' });
    }

    // Clear the authToken cookie with same configuration
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : 'localhost'
    });

    logger.info(`Logout successful for token: ${token}`);
    res.json({ message: 'Logout successful' });
  } catch (err) {
    logger.error(`Logout error: ${err.message}`);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

module.exports = {
  register,
  forgotPasswordRequest,
  resetPassword,
  loginChallenge,
  loginVerify,
  loginWithPassword,
  refresh,
  logout
};
