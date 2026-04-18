const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide content'],
    },
    type: {
      type: String,
      enum: ['Announcement', 'Opportunity', 'Contest', 'Hackathon'],
      default: 'Announcement',
    },
    externalLink: {
      type: String,
    },
    eventDate: {
      type: Date,
    },
    location: {
      type: String,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
