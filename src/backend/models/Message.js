// backend/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ['general', 'appointment', 'prescription', 'test-results', 'billing', 'emergency'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    attachments: [{
      filename: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    relatedAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    relatedPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'messages'
  }
);

// Indexes for better query performance
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, recipientId: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ relatedAppointmentId: 1 });
messageSchema.index({ relatedPatientId: 1 });

module.exports = mongoose.model('Message', messageSchema);
