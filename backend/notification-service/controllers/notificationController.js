const Notification = require('../models/notificationModel');
const logger = require('../config/logger');

// Get all notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error(`Error in getMyNotifications: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a single notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if the user owns this notification
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized' });
    }

    notification.isRead = true;
    await notification.save();
    logger.info(`Notification ${notification.id} marked as read by user ${req.user.id}`);
    res.json(notification);
  } catch (error) {
    logger.error(`Error in markNotificationAsRead: ${error.message}`, { notifyId: req.params.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    logger.info(`All notifications marked as read for user ${req.user.id}`);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    logger.error(`Error in markAllNotificationsAsRead: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a notification (for internal service use)
exports.createNotificationInternal = async (req, res) => {
  const { user, message, relatedLink } = req.body;

  if (!user || !message) {
    return res.status(400).json({ message: 'User and message are required.' });
  }

  try {
    const newNotification = new Notification({
      user,
      message,
      relatedLink: relatedLink || '#',
    });

    const notification = await newNotification.save();
    
    // Log that an internal service created this
    logger.info(`Internal notification created for user ${user} by service user ${req.user.id}`);
    
    res.status(201).json(notification);
  } catch (error) {
    logger.error(`Error in createNotificationInternal: ${error.message}`, { userId: user, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};