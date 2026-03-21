const HackathonRegistration = require('../models/registrationModel');
const Hackathon = require('../models/hackathonModel');
const logger = require('../config/logger');

// Register team for hackathon
exports.registerTeam = async (req, res) => {
  const { hackathonId } = req.params;
  const { teamName, teamMembers } = req.body;

  try {
    // Validate required fields
    if (!hackathonId || !teamName || !teamMembers || teamMembers.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if hackathon exists
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Check registration deadline
    if (new Date() > new Date(hackathon.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check team size
    if (teamMembers.length > hackathon.maxTeamSize) {
      return res.status(400).json({
        message: `Team size exceeds maximum allowed size of ${hackathon.maxTeamSize}`,
      });
    }

    // Check if team head is already registered for this hackathon
    const existingRegistration = await HackathonRegistration.findOne({
      hackathon: hackathonId,
      teamHead: req.user.id,
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this hackathon' });
    }

    // Create new registration
    const newRegistration = new HackathonRegistration({
      hackathon: hackathonId,
      teamHead: req.user.id,
      teamName,
      teamMembers,
      registrationStatus: 'pending',
    });

    const savedRegistration = await newRegistration.save();

    // Add registration to hackathon's registrations array
    hackathon.registrations.push(savedRegistration._id);
    await hackathon.save();

    logger.info(`Team registered for hackathon: ${savedRegistration._id}`, {
      userId: req.user.id,
      hackathonId,
      teamSize: teamMembers.length,
    });

    res.status(201).json(savedRegistration);
  } catch (error) {
    logger.error(`Error in registerTeam: ${error.message}`, {
      userId: req.user.id,
      hackathonId,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get registrations for a hackathon (TPO/Admin)
exports.getHackathonRegistrations = async (req, res) => {
  const { hackathonId } = req.params;

  try {
    const registrations = await HackathonRegistration.find({
      hackathon: hackathonId,
    })
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    logger.error(`Error in getHackathonRegistrations: ${error.message}`, {
      hackathonId,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's registrations
exports.getUserRegistrations = async (req, res) => {
  try {
    const registrations = await HackathonRegistration.find({
      teamHead: req.user.id,
    })
      .sort({ createdAt: -1 });

    res.json(registrations);
  } catch (error) {
    logger.error(`Error in getUserRegistrations: ${error.message}`, {
      userId: req.user.id,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get registration by ID
exports.getRegistrationById = async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await HackathonRegistration.findById(id)
      .populate('hackathon')
      .populate('teamHead', 'name email')
      .populate('teamMembers.userId', 'name email');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    res.json(registration);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Registration not found' });
    }
    logger.error(`Error in getRegistrationById: ${error.message}`, {
      registrationId: id,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Update registration (add submission link, etc.)
exports.updateRegistration = async (req, res) => {
  const { id } = req.params;
  const { teamName, teamMembers, submissionLink } = req.body;

  try {
    const registration = await HackathonRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Only team head can update their registration
    if (registration.teamHead.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own registration' });
    }

    if (teamName) registration.teamName = teamName;
    if (teamMembers) registration.teamMembers = teamMembers;
    if (submissionLink) registration.submissionLink = submissionLink;

    const updatedRegistration = await registration.save();
    logger.info(`Registration updated: ${id}`, { userId: req.user.id });
    res.json(updatedRegistration);
  } catch (error) {
    logger.error(`Error in updateRegistration: ${error.message}`, {
      registrationId: id,
      userId: req.user.id,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve registration (TPO/Admin)
exports.approveRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await HackathonRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.registrationStatus = 'approved';
    const updatedRegistration = await registration.save();

    logger.info(`Registration approved: ${id}`, { userId: req.user.id });
    res.json(updatedRegistration);
  } catch (error) {
    logger.error(`Error in approveRegistration: ${error.message}`, {
      registrationId: id,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject registration (TPO/Admin)
exports.rejectRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await HackathonRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.registrationStatus = 'rejected';
    const updatedRegistration = await registration.save();

    logger.info(`Registration rejected: ${id}`, { userId: req.user.id });
    res.json(updatedRegistration);
  } catch (error) {
    logger.error(`Error in rejectRegistration: ${error.message}`, {
      registrationId: id,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel registration
exports.cancelRegistration = async (req, res) => {
  const { id } = req.params;

  try {
    const registration = await HackathonRegistration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Only team head can cancel their registration
    if (registration.teamHead.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only cancel your own registration' });
    }

    // Remove from hackathon's registrations array
    const hackathon = await Hackathon.findById(registration.hackathon);
    if (hackathon) {
      hackathon.registrations = hackathon.registrations.filter(
        (regId) => regId.toString() !== id
      );
      await hackathon.save();
    }

    await HackathonRegistration.findByIdAndDelete(id);
    logger.info(`Registration cancelled: ${id}`, { userId: req.user.id });
    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    logger.error(`Error in cancelRegistration: ${error.message}`, {
      registrationId: id,
      userId: req.user.id,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Server error' });
  }
};
