// backend/services/auditLogger.js

const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

// AES-256 encryption key (in production, use environment variable)
const ENCRYPTION_KEY = process.env.AUDIT_ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 bytes
const ALGORITHM = 'aes-256-cbc';

/**
 * Pseudonymize an identifier using SHA-256 hash
 * @param {string} identifier - The identifier to pseudonymize
 * @returns {string} Hashed identifier
 */
function pseudonymize(identifier) {
  return crypto.createHash('sha256').update(identifier).digest('hex');
}

/**
 * Encrypt data using AES-256
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text (IV + encrypted data in base64)
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data using AES-256 (for admin purposes if needed)
 * @param {string} encryptedText - Encrypted text (IV:encrypted)
 * @returns {string} Decrypted text
 */
function decrypt(encryptedText) {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Log an audit event
 * @param {string} event - Event type (e.g., 'login', 'registration')
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} ip - IP address
 * @param {string} token - JWT token (optional)
 * @param {number} riskScore - Risk score (optional)
 * @param {object} additionalData - Additional data to log
 */
async function logEvent(event, userId, email, ip, token = null, riskScore = null, additionalData = {}) {
  try {
    const pseudonymizedUserId = pseudonymize(userId);
    const pseudonymizedEmail = pseudonymize(email);
    const tokenHash = token ? pseudonymize(token) : null;

    // Prepare data to encrypt
    const dataToEncrypt = JSON.stringify({
      event,
      originalUserId: userId, // Store original for decryption if needed (GDPR compliance)
      originalEmail: email,
      ip,
      token: token ? token.substring(0, 10) + '...' : null, // Partial token for reference
      riskScore,
      additionalData,
      timestamp: new Date().toISOString()
    });

    const encryptedData = encrypt(dataToEncrypt);

    const auditEntry = new AuditLog({
      event,
      pseudonymizedUserId,
      pseudonymizedEmail,
      ip,
      tokenHash,
      encryptedData,
      riskScore
    });

    await auditEntry.save();
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // In production, you might want to use a fallback logging mechanism
  }
}

module.exports = {
  logEvent,
  pseudonymize,
  encrypt,
  decrypt
};
