const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

router.post('/', protect, messageController.sendMessage);
router.get('/:id', protect, messageController.getMessages);
router.put('/:id/read', protect, messageController.markAsRead);

module.exports = router;
