module.exports = (Announcement, logger) => {
  return {
    getAllAnnouncements: async (req, res) => {
      try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.json(announcements);
      } catch (error) {
        logger.error(`Error in getAllAnnouncements: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    createAnnouncement: async (req, res) => {
      const { title, content, externalLink, type, eventDate, location } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
      }

      try {
        const newAnnouncement = new Announcement({
          title,
          content,
          type: type || 'Announcement',
          externalLink: externalLink || null,
          eventDate: eventDate || null,
          location: location || null,
          author: req.user.id,
        });

        const announcement = await newAnnouncement.save();
        logger.info(`New announcement created: ${announcement.id} by TPO user ${req.user.id}`);
        res.status(201).json(announcement);
      } catch (error) {
        logger.error(`Error in createAnnouncement: ${error.message}`, { userId: req.user.id, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    updateAnnouncement: async (req, res) => {
      const { title, content, externalLink, type, eventDate, location } = req.body;
      const { id } = req.params;

      try {
        let announcement = await Announcement.findById(id);
        if (!announcement) {
          return res.status(404).json({ message: 'Announcement not found.' });
        }

        announcement.title = title || announcement.title;
        announcement.content = content || announcement.content;
        announcement.type = type || announcement.type;
        announcement.externalLink = externalLink;
        announcement.eventDate = eventDate || announcement.eventDate;
        announcement.location = location || announcement.location;

        const updatedAnnouncement = await announcement.save();
        logger.info(`Announcement updated: ${updatedAnnouncement.id} by TPO user ${req.user.id}`);
        res.json(updatedAnnouncement);
      } catch (error) {
        logger.error(`Error in updateAnnouncement: ${error.message}`, { announceId: id, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    deleteAnnouncement: async (req, res) => {
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
    },
  };
};
