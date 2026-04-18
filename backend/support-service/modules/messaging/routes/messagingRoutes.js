const express = require('express');

module.exports = (conversationController, messageController, { protect }) => {
  const router = express.Router();

  router.post('/conversations/start', protect, conversationController.startConversation);
  router.get('/conversations/me', protect, conversationController.getConversations);
  router.get('/conversations/:id', protect, conversationController.getConversationById);

  router.post('/messages', protect, messageController.sendMessage);
  router.get('/messages/:id', protect, messageController.getMessages);
  router.put('/messages/:id/read', protect, messageController.markAsRead);

  return router;
};
