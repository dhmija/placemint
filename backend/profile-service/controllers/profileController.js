const Profile = require('../models/profileModel');
const logger = require('../config/logger');

// Get current user's profile
exports.getMyProfile = async (req, res) => {
  try {
    // req.user.id comes from the 'protect' middleware
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      logger.info(`No profile found for user ${req.user.id}`);
      return res.status(404).json({ message: 'Profile not found for this user.' });
    }
    res.json(profile);
  } catch (error) {
    logger.error(`Error in getMyProfile: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Create or update user profile
exports.createOrUpdateProfile = async (req, res) => {
  const { name, enrollmentNumber, age, gender, gpa } = req.body;
  const userId = req.user.id; // From 'protect' middleware

  const profileFields = {
    user: userId,
    name,
    enrollmentNumber,
    age,
    gender,
    gpa,
  };
  
  // Handle skills (ensure it's an array)
  if (req.body.skills) {
    if (Array.isArray(req.body.skills)) {
      profileFields.skills = req.body.skills;
    } else if (typeof req.body.skills === 'string') {
      profileFields.skills = req.body.skills.split(',').map(skill => skill.trim());
    }
  } else {
    profileFields.skills = [];
  }


  // Handle file upload
  if (req.file) {
    // We store the web-accessible path
    profileFields.resumeURL = `/uploads/${req.file.filename}`;
    logger.info(`New resume uploaded for user ${userId}: ${profileFields.resumeURL}`);
  }

  try {
    let profile = await Profile.findOne({ user: userId });

    if (profile) {
      // Update existing profile
      // Keep the old resume if a new one isn't uploaded
      if (!req.file && profile.resumeURL) {
        profileFields.resumeURL = profile.resumeURL;
      }
      
      profile = await Profile.findOneAndUpdate(
        { user: userId },
        { $set: profileFields },
        { new: true, runValidators: true }
      );
      logger.info(`Profile updated for user: ${userId}`);
      return res.json(profile);
    }

    // Create new profile
    profile = new Profile(profileFields);
    await profile.save();
    logger.info(`New profile created for user: ${userId}`);
    res.status(201).json(profile);

  } catch (error) {
    // Handle duplicate enrollment number error
    if (error.code === 11000) {
      logger.warn(`Profile creation/update failed: Duplicate enrollment number - ${enrollmentNumber}`);
      return res.status(400).json({ message: 'Enrollment number already exists.' });
    }
    logger.error(`Error in createOrUpdateProfile: ${error.message}`, { userId, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all profiles (for TPO)
exports.getAllProfiles = async (req, res) => {
  try {
    // In a real app, you might filter by role by calling auth-service
    // For now, we just get all profiles.
    const profiles = await Profile.find().sort({ createdAt: -1 });
    logger.info(`TPO ${req.user.id} retrieved all profiles`);
    res.json(profiles);
  } catch (error) {
    logger.error(`Error in getAllProfiles: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get profile by user ID (for internal services)
exports.getProfileByUserId = async (req, res) => {
  const { userId } = req.params;
  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    // This endpoint is internal, so we log who is asking
    logger.info(`Internal request for profile by ${req.user.id} (Role: ${req.user.role}) for user ${userId}`);
    res.json(profile);
  } catch (error) {
    logger.error(`Error in getProfileByUserId: ${error.message}`, { userId, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Search for users by name (for messaging feature)
exports.searchProfiles = async (req, res) => {
  try {
    const { query, role } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Build search criteria
    const searchCriteria = {
      name: { $regex: query, $options: 'i' }, // Case-insensitive search
      user: { $ne: currentUserId }, // Exclude current user
    };

    // If filtering by role, we need to call auth service to get users by role
    // For now, we'll search by name in profiles
    let profiles = await Profile.find(searchCriteria).limit(20);

    // If role filter is specified, we need to enrich with user role info
    // For simplicity in this phase, return profiles as-is
    res.json(profiles);
  } catch (error) {
    logger.error(`Error in searchProfiles: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};