const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const conversationController = require('../controllers/conversationController');

router.post('/start', protect, conversationController.startConversation);
router.get('/me', protect, conversationController.getConversations);
router.get('/:id', protect, conversationController.getConversationById);

module.exports = router;
