// backend/services/riskScoringService.js

/**
 * Risk Scoring Engine
 * Computes risk score R = f(b, d, l)
 * Where:
 * - b: biometric input (optional, score 0-10, lower is better)
 * - d: device posture (score based on device info)
 * - l: location (score based on location info)
 *
 * Returns a risk score between 0-100, where higher is riskier.
 */

// Configuration
const RISK_THRESHOLD = 70; // Threshold for triggering adaptive MFA

/**
 * Compute biometric risk score
 * @param {number|null} biometricScore - Biometric score (0-10, lower better), null if not available
 * @returns {number} Risk score contribution (0-30)
 */
function computeBiometricRisk(biometricScore) {
  if (biometricScore === null) {
    return 20; // Medium risk if no biometric
  }
  // Lower biometric score means lower risk
  return Math.max(0, (10 - biometricScore) * 3); // Scale to 0-30
}

/**
 * Compute device posture risk score
 * @param {object} device - Device info from session
 * @returns {number} Risk score contribution (0-30)
 */
function computeDeviceRisk(device) {
  let risk = 0;

  // Mobile devices might be riskier
  if (device.isMobile) {
    risk += 10;
  }

  // Unknown or uncommon browsers/OS might be riskier
  const commonBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const commonOS = ['Windows', 'macOS', 'Linux', 'Android', 'iOS'];

  if (!commonBrowsers.includes(device.browser)) {
    risk += 10;
  }

  if (!commonOS.includes(device.os)) {
    risk += 10;
  }

  return Math.min(30, risk); // Cap at 30
}

/**
 * Compute location risk score
 * @param {object} location - Location info from IP
 * @param {string} userId - User ID to check against known locations (future enhancement)
 * @returns {number} Risk score contribution (0-40)
 */
function computeLocationRisk(location, userId) {
  let risk = 0;

  // For now, assume medium risk for unknown locations
  // In future, compare against user's known locations
  if (!location.city || !location.country) {
    risk += 20; // High risk if location unknown
  } else {
    risk += 10; // Medium risk for known location
  }

  // Add risk for certain high-risk countries (example)
  const highRiskCountries = ['Unknown', '']; // Add actual high-risk countries if needed
  if (highRiskCountries.includes(location.country)) {
    risk += 10;
  }

  return Math.min(40, risk); // Cap at 40
}

/**
 * Compute overall risk score
 * @param {number|null} biometricScore - Biometric score
 * @param {object} device - Device info
 * @param {object} location - Location info
 * @param {string} userId - User ID
 * @returns {number} Overall risk score (0-100)
 */
function computeRiskScore(biometricScore, device, location, userId) {
  const biometricRisk = computeBiometricRisk(biometricScore);
  const deviceRisk = computeDeviceRisk(device);
  const locationRisk = computeLocationRisk(location, userId);

  // Weighted sum: biometric 30%, device 30%, location 40%
  const totalRisk = (biometricRisk * 0.3) + (deviceRisk * 0.3) + (locationRisk * 0.4);

  return Math.round(totalRisk); // Round to nearest integer
}

/**
 * Check if adaptive MFA should be triggered
 * @param {number} riskScore - Computed risk score
 * @returns {boolean} True if MFA should be triggered
 */
function shouldTriggerMFA(riskScore) {
  return riskScore >= RISK_THRESHOLD;
}

module.exports = {
  computeRiskScore,
  shouldTriggerMFA,
  RISK_THRESHOLD
};
