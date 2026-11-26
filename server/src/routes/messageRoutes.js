const express = require('express');
const router = express.Router();

const {
    getConversations,
    sendMessage,
    getConversation,
    markMessagesAsRead
} = require('../controllers/messageController');

const authMiddleware = require('../middlewares/authMiddleware');
router.get('/conversations', authMiddleware, getConversations);
router.post('/:userId', authMiddleware, sendMessage);
router.get('/:userId', authMiddleware, getConversation);
router.put('/:userId/read', authMiddleware, markMessagesAsRead);
module.exports = router;