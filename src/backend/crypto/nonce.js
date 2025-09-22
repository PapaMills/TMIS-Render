// backend/crypto/nonce.js

const crypto = require('crypto');

const generateNonce = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateNonce,
};
