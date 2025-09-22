// backend/controllers/messageController.js

const Message = require('../models/Message');
const logger = require('../utils/logger');

// Get all messages for current user (inbox)
const getMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      messageType,
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user.userId;

    // Build filter object
    let filter = {
      recipientId: userId,
      isArchived: { $ne: true }
    };

    if (messageType) filter.messageType = messageType;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const messages = await Message.find(filter)
      .populate('senderId', 'firstName lastName email')
      .populate('recipientId', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Message.countDocuments(filter);

    res.json({
      success: true,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    logger.error(`Get messages error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};

// Get sent messages
const getSentMessages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user.userId;

    const filter = {
      senderId: userId,
      isArchived: { $ne: true }
    };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const messages = await Message.find(filter)
      .populate('senderId', 'firstName lastName email')
      .populate('recipientId', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Message.countDocuments(filter);

    res.json({
      success: true,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    logger.error(`Get sent messages error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sent messages'
    });
  }
};

// Get single message by ID
const getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOne({
      _id: id,
      $or: [
        { recipientId: userId },
        { senderId: userId }
      ]
    })
      .populate('senderId', 'firstName lastName email')
      .populate('recipientId', 'firstName lastName email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark as read if user is recipient and message is unread
    if (message.recipientId.toString() === userId && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.json({
      success: true,
      message
    });
  } catch (err) {
    logger.error(`Get message error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching message'
    });
  }
};

// Send new message
const sendMessage = async (req, res) => {
  try {
    const { recipientId, subject, content, messageType = 'general', priority = 'medium' } = req.body;

    const messageData = {
      senderId: req.user.userId,
      recipientId,
      subject,
      content,
      messageType,
      priority
    };

    const message = new Message(messageData);
    await message.save();

    await message.populate('senderId', 'firstName lastName email');
    await message.populate('recipientId', 'firstName lastName email');

    logger.info(`Message sent: ${message._id} from ${req.user.userId} to ${recipientId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      message
    });
  } catch (err) {
    logger.error(`Send message error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
};

// Mark message as read
const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOneAndUpdate(
      {
        _id: id,
        recipientId: userId
      },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    )
      .populate('senderId', 'firstName lastName email')
      .populate('recipientId', 'firstName lastName email');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      message
    });
  } catch (err) {
    logger.error(`Mark message read error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while marking message as read'
    });
  }
};

// Archive message
const archiveMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { recipientId: userId },
          { senderId: userId }
        ]
      },
      {
        isArchived: true,
        archivedAt: new Date()
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message archived successfully'
    });
  } catch (err) {
    logger.error(`Archive message error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while archiving message'
    });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOneAndDelete({
      _id: id,
      $or: [
        { recipientId: userId },
        { senderId: userId }
      ]
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    logger.info(`Message deleted: ${id} by user ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (err) {
    logger.error(`Delete message error: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
};

module.exports = {
  getMessages,
  getSentMessages,
  getMessage,
  sendMessage,
  markMessageRead,
  archiveMessage,
  deleteMessage
};
