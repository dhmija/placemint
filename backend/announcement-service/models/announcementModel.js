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
    // --- NEW FEATURE ---
    // Type to distinguish between different posts
    type: {
      type: String,
      enum: ['Announcement', 'Opportunity', 'Contest', 'Hackathon'],
      default: 'Announcement',
    },
    // Optional external link (e.g., to an Amazon job page)
    externalLink: {
      type: String,
    },
    // Optional event date (for Hackathons and Contests)
    eventDate: {
      type: Date,
    },
    // Optional location (for Hackathons and Contests)
    location: {
      type: String,
    },
    // The TPO user who created it
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