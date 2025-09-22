// backend/models/AuditLog.js

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30 days in seconds
  },
  event: {
    type: String,
    required: true
  },
  pseudonymizedUserId: {
    type: String,
    required: true
  },
  pseudonymizedEmail: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  tokenHash: {
    type: String
  },
  encryptedData: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number
  }
}, {
  collection: 'audit_logs'
});

// Index for efficient queries if needed
auditLogSchema.index({ pseudonymizedUserId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
