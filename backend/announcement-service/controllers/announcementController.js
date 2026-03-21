const Announcement = require('../models/announcementModel');
const logger = require('../config/logger');

// Get all announcements, newest first
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    logger.error(`Error in getAllAnnouncements: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
  // --- UPDATED ---
  const { title, content, externalLink, type, eventDate, location } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const newAnnouncement = new Announcement({
      title,
      content,
      type: type || 'Announcement', // Default to 'Announcement' if not specified
      externalLink: externalLink || null,
      eventDate: eventDate || null, // Optional for Hackathons/Contests
      location: location || null, // Optional for Hackathons/Contests
      author: req.user.id, // TPO user from 'protect' middleware
    });

    const announcement = await newAnnouncement.save();
    logger.info(`New announcement created: ${announcement.id} by TPO user ${req.user.id}`);
    res.status(201).json(announcement);
  } catch (error) {
    logger.error(`Error in createAnnouncement: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an announcement
exports.updateAnnouncement = async (req, res) => {
  // --- UPDATED ---
  const { title, content, externalLink, type, eventDate, location } = req.body;
  const { id } = req.params;

  try {
    let announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    // TPO users can edit any announcement (no need to check author)
    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.type = type || announcement.type;
    announcement.externalLink = externalLink; // Allow setting it to null or new value
    announcement.eventDate = eventDate || announcement.eventDate;
    announcement.location = location || announcement.location;

    const updatedAnnouncement = await announcement.save();
    logger.info(`Announcement updated: ${updatedAnnouncement.id} by TPO user ${req.user.id}`);
    res.json(updatedAnnouncement);

  } catch (error) {
    logger.error(`Error in updateAnnouncement: ${error.message}`, { announceId: id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an announcement
exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    await announcement.deleteOne();
    logger.info(`Announcement deleted: ${id} by TPO user ${req.user.id}`);
    res.json({ message: 'Announcement removed successfully.' });

  } catch (error) {
    logger.error(`Error in deleteAnnouncement: ${error.message}`, { announceId: id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};