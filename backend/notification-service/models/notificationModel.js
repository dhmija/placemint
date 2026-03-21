const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // The user who will receive the notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true, // Index this field for faster lookups
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // A link to navigate to when the notification is clicked
    // e.g., '/my-applications' or '/job/123/applicants'
    relatedLink: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;