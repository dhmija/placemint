const Hackathon = require('../models/hackathonModel');
const logger = require('../config/logger');

// Get all hackathons
exports.getAllHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find()
      .sort({ startDate: -1 });
    res.json(hackathons);
  } catch (error) {
    logger.error(`Error in getAllHackathons: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active hackathons only
exports.getActiveHackathons = async (req, res) => {
  try {
    const hackathons = await Hackathon.find({
      isActive: true,
      status: { $in: ['upcoming', 'ongoing'] },
    })
      .sort({ startDate: -1 });
    res.json(hackathons);
  } catch (error) {
    logger.error(`Error in getActiveHackathons: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get hackathon by ID
exports.getHackathonById = async (req, res) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) {
      logger.warn(`Hackathon not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Hackathon not found' });
    }
    res.json(hackathon);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Hackathon not found' });
    }
    logger.error(`Error in getHackathonById: ${error.message}`, { hackathonId: req.params.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new hackathon (TPO/Admin only)
exports.createHackathon = async (req, res) => {
  const { title, description, organization, startDate, endDate, registrationDeadline, location, prize, maxTeamSize } = req.body;

  try {
    // Validate required fields
    if (!title || !description || !organization || !startDate || !endDate || !registrationDeadline || !maxTeamSize) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const newHackathon = new Hackathon({
      title,
      description,
      organization,
      startDate,
      endDate,
      registrationDeadline,
      location: location || 'Online',
      prize: prize || 'TBD',
      maxTeamSize,
      createdBy: req.user.id,
    });

    const savedHackathon = await newHackathon.save();
    logger.info(`New hackathon created: ${savedHackathon._id}`, { userId: req.user.id });
    res.status(201).json(savedHackathon);
  } catch (error) {
    logger.error(`Error in createHackathon: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a hackathon (TPO/Admin only)
exports.updateHackathon = async (req, res) => {
  const { id } = req.params;
  const { title, description, organization, startDate, endDate, registrationDeadline, location, prize, maxTeamSize, status, isActive } = req.body;

  try {
    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      logger.warn(`Hackathon not found for update: ${id}`);
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Update fields
    if (title) hackathon.title = title;
    if (description) hackathon.description = description;
    if (organization) hackathon.organization = organization;
    if (startDate) hackathon.startDate = startDate;
    if (endDate) hackathon.endDate = endDate;
    if (registrationDeadline) hackathon.registrationDeadline = registrationDeadline;
    if (location) hackathon.location = location;
    if (prize) hackathon.prize = prize;
    if (maxTeamSize) hackathon.maxTeamSize = maxTeamSize;
    if (status) hackathon.status = status;
    if (isActive !== undefined) hackathon.isActive = isActive;

    const updatedHackathon = await hackathon.save();
    logger.info(`Hackathon updated: ${id}`, { userId: req.user.id });
    res.json(updatedHackathon);
  } catch (error) {
    logger.error(`Error in updateHackathon: ${error.message}`, { hackathonId: id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a hackathon (TPO/Admin only)
exports.deleteHackathon = async (req, res) => {
  const { id } = req.params;

  try {
    const hackathon = await Hackathon.findByIdAndDelete(id);
    if (!hackathon) {
      logger.warn(`Hackathon not found for deletion: ${id}`);
      return res.status(404).json({ message: 'Hackathon not found' });
    }
    logger.info(`Hackathon deleted: ${id}`, { userId: req.user.id });
    res.json({ message: 'Hackathon deleted successfully' });
  } catch (error) {
    logger.error(`Error in deleteHackathon: ${error.message}`, { hackathonId: id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};
