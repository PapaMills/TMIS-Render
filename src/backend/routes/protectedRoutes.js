const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const sessionService = require('../services/sessionService');

router.get('/secure-data', authMiddleware, (req, res) => {
  res.json({
    message: 'You have access to secure data!',
    user: req.user,
  });
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Messages endpoints
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    // For now, return empty messages array
    // In a real implementation, this would fetch from a messages collection
    res.json({
      success: true,
      messages: []
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const { subject, message, recipient } = req.body;

    if (!subject || !message || !recipient) {
      return res.status(400).json({ message: 'Subject, message, and recipient are required' });
    }

    // For now, just acknowledge the message
    // In a real implementation, this would save to a messages collection
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/messages/:messageId/read', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;

    // For now, just acknowledge the read status
    // In a real implementation, this would update the message in the database
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Message read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sessions endpoint
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await sessionService.findActiveSessionsByUser(userId);

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        id: session._id,
        token: session.token,
        ip: session.ip,
        location: session.location,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity
      }))
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
