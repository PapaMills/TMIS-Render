const crypto = require('crypto');

const generateKeyPair = async () => {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair('ec', {
      namedCurve: 'prime256v1', // P-256 curve for WebCrypto compatibility
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }, (err, publicKey, privateKey) => {
      if (err) reject(err);
      resolve({
        privateKey: privateKey,
        publicKey: publicKey
      });
    });
  });
};

const getKeyFromPublic = (publicKeyData) => {
  console.log('[DEBUG] getKeyFromPublic input:', publicKeyData.substring(0, 50) + '...');

  try {
    // Try to parse as JSON (JWK)
    const jwk = JSON.parse(publicKeyData);
    if (jwk && jwk.kty === 'EC') {
      console.log('[DEBUG] Parsed as JWK');
      // Import from JWK
      return crypto.createPublicKey({
        key: jwk,
        format: 'jwk'
      });
    }
  } catch (e) {
    console.log('[DEBUG] Not JWK, trying PEM');
    // Not JSON, try PEM format first
    try {
      const key = crypto.createPublicKey(publicKeyData);
      console.log('[DEBUG] Successfully parsed as PEM, key type:', typeof key);
      return key;
    } catch (pemErr) {
      console.log('[DEBUG] Not PEM, trying base64 SPKI');
      // Try base64 SPKI format (from frontend)
      try {
        // Convert base64 SPKI to PEM format
        const spkiPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyData.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
        console.log('[DEBUG] Converted to PEM format');

        const key = crypto.createPublicKey(spkiPem);
        console.log('[DEBUG] Successfully parsed as PEM from SPKI, key type:', typeof key);
        console.log('[DEBUG] Key properties:', Object.getOwnPropertyNames(key));
        console.log('[DEBUG] Key methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(key)));
        console.log('[DEBUG] Key asymmetricKeyType:', key.asymmetricKeyType);
        return key;
      } catch (spkiErr) {
        console.log('[DEBUG] SPKI parse error:', spkiErr.message);
        throw new Error('Invalid public key format');
      }
    }
  }
};

// Verify ECC signature using the public key
const verifySignature = (publicKey, message, signatureBase64) => {
  try {
    console.log('[DEBUG] verifySignature called with message length:', message.length, 'signature length:', signatureBase64.length);

    // Convert base64 signature to buffer
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    console.log('[DEBUG] Signature buffer length:', signatureBuffer.length);

    // Create verify object
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    verify.end();

    // Get the public key in the right format for verification
    const publicKeyBuffer = publicKey.export({ type: 'spki', format: 'der' });

    const isValid = verify.verify(
      {
        key: publicKeyBuffer,
        dsaEncoding: 'ieee-p1363'
      },
      signatureBuffer
    );

    console.log('[DEBUG] Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.log('[DEBUG] Signature verification error:', error.message);
    return false;
  }
};

module.exports = {
  generateKeyPair,
  getKeyFromPublic,
  verifySignature
};
