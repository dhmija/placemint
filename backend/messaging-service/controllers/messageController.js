const Message = require('../models/messageModel');
const Conversation = require('../models/conversationModel');
const logger = require('../config/logger');

// Send a message within a conversation (or create conversation implicitly)
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content, recipientId } = req.body;
    const senderId = req.user.id;
    const senderRole = req.user.role;

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    } else {
      // Create conversation implicitly if not provided
      conversation = await Conversation.findOne({ participantIds: { $all: [senderId, recipientId] } });
      if (!conversation) {
        const studentId = senderRole === 'student' ? senderId : recipientId;
        const recruiterId = senderRole === 'recruiter' ? senderId : recipientId;
        conversation = new Conversation({ participantIds: [senderId, recipientId], studentId, recruiterId });
        await conversation.save();
      }
    }

    const message = new Message({
      conversationId: conversation._id,
      senderId,
      senderRole,
      receiverId: recipientId,
      content,
    });

    await message.save();

    // Update conversation meta
    conversation.lastMessage = content;
    conversation.lastMessageTime = new Date();
    if (senderRole === 'student') {
      conversation.unreadCount.recruiter += 1;
    } else {
      conversation.unreadCount.student += 1;
    }
    await conversation.save();

    logger.info(`Message sent in conversation ${conversation._id}`);

    res.status(201).json({ message, conversation });
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get messages for a conversation (with pagination)
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params; // conversation id
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (!conversation.participantIds.includes(userId)) return res.status(403).json({ error: 'Unauthorized' });

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    logger.error(`Error fetching messages: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Mark messages as read in a conversation for the current user
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params; // conversation id
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (!conversation.participantIds.includes(userId)) return res.status(403).json({ error: 'Unauthorized' });

    const query = { conversationId: id, receiverId: userId, isRead: false };
    await Message.updateMany(query, { isRead: true, readAt: new Date() });

    // Reset unread count
    if (userRole === 'student') {
      conversation.unreadCount.student = 0;
    } else {
      conversation.unreadCount.recruiter = 0;
    }
    await conversation.save();

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`Error marking messages as read: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
