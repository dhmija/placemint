const express = require('express');
const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotificationInternal,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /
// @desc    Get all notifications for the logged-in user
// @access  Private
router.get('/', protect, getMyNotifications);

// @route   PUT /:id/read
// @desc    Mark a single notification as read
// @access  Private
router.put('/:id/read', protect, markNotificationAsRead);

// @route   PUT /read-all
// @desc    Mark all unread notifications as read
// @access  Private
router.put('/read-all', protect, markAllNotificationsAsRead);

// @route   POST /internal/create
// @desc    Create a notification (for internal service-to-service calls)
// @access  Private (Protected by 'protect' middleware)
router.post('/internal/create', protect, createNotificationInternal);

module.exports = router;