// backend/routes/messageRoutes.js

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// All message routes require authentication
router.use(authMiddleware);

// GET /api/protected/messages - Get inbox messages
router.get('/', messageController.getMessages);

// GET /api/protected/messages/sent - Get sent messages
router.get('/sent', messageController.getSentMessages);

// GET /api/protected/messages/:id - Get single message
router.get('/:id', messageController.getMessage);

// POST /api/protected/messages - Send new message
router.post('/', messageController.sendMessage);

// PUT /api/protected/messages/:id/read - Mark message as read
router.put('/:id/read', messageController.markMessageRead);

// PUT /api/protected/messages/:id/archive - Archive message
router.put('/:id/archive', messageController.archiveMessage);

// DELETE /api/protected/messages/:id - Delete message
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
