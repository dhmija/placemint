const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const logger = require('../config/logger');

// Start a new conversation or get existing one
exports.startConversation = async (req, res) => {
  try {
    const { recipientId, jobId, interviewId } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    logger.info(`Starting conversation between ${userId} and ${recipientId}`);

    let conversation = await Conversation.findOne({
      participantIds: { $all: [userId, recipientId] },
    });

    if (!conversation) {
      const studentId = userRole === 'student' ? userId : recipientId;
      const recruiterId = userRole === 'recruiter' ? userId : recipientId;

      conversation = new Conversation({
        participantIds: [userId, recipientId],
        studentId,
        recruiterId,
        jobId: jobId || null,
        interviewId: interviewId || null,
      });

      await conversation.save();
      logger.info(`New conversation created: ${conversation._id}`);
    }

    res.status(200).json(conversation);
  } catch (error) {
    logger.error(`Error starting conversation: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info(`Fetching conversations for user ${userId}`);

    const conversations = await Conversation.find({
      participantIds: userId,
    })
      .sort({ lastMessageTime: -1 })
      .exec();

    res.status(200).json(conversations);
  } catch (error) {
    logger.error(`Error fetching conversations: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get specific conversation by ID
exports.getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info(`Fetching conversation ${id}`);

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify user is part of this conversation
    if (!conversation.participantIds.includes(userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.status(200).json(conversation);
  } catch (error) {
    logger.error(`Error fetching conversation: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
