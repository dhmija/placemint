module.exports = (Profile, logger) => {
  return {
    getMyProfile: async (req, res) => {
      try {
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
    },

    createOrUpdateProfile: async (req, res) => {
      const { name, enrollmentNumber, age, gender, gpa } = req.body;
      const userId = req.user.id;

      const profileFields = {
        user: userId,
        name,
        enrollmentNumber,
        age,
        gender,
        gpa,
      };

      if (req.body.skills) {
        if (Array.isArray(req.body.skills)) {
          profileFields.skills = req.body.skills;
        } else if (typeof req.body.skills === 'string') {
          profileFields.skills = req.body.skills.split(',').map(skill => skill.trim());
        }
      } else {
        profileFields.skills = [];
      }

      if (req.file) {
        profileFields.resumeURL = `/uploads/${req.file.filename}`;
        logger.info(`New resume uploaded for user ${userId}: ${profileFields.resumeURL}`);
      }

      try {
        let profile = await Profile.findOne({ user: userId });

        if (profile) {
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

        profile = new Profile(profileFields);
        await profile.save();
        logger.info(`New profile created for user: ${userId}`);
        res.status(201).json(profile);
      } catch (error) {
        if (error.code === 11000) {
          logger.warn(`Profile creation/update failed: Duplicate enrollment number - ${enrollmentNumber}`);
          return res.status(400).json({ message: 'Enrollment number already exists.' });
        }
        logger.error(`Error in createOrUpdateProfile: ${error.message}`, { userId, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getAllProfiles: async (req, res) => {
      try {
        const profiles = await Profile.find().sort({ createdAt: -1 });
        logger.info(`TPO ${req.user.id} retrieved all profiles`);
        res.json(profiles);
      } catch (error) {
        logger.error(`Error in getAllProfiles: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getProfileByUserId: async (req, res) => {
      const { userId } = req.params;
      try {
        const profile = await Profile.findOne({ user: userId });
        if (!profile) {
          return res.status(404).json({ message: 'Profile not found.' });
        }
        logger.info(`Internal request for profile by ${req.user.id} (Role: ${req.user.role}) for user ${userId}`);
        res.json(profile);
      } catch (error) {
        logger.error(`Error in getProfileByUserId: ${error.message}`, { userId, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    searchProfiles: async (req, res) => {
      try {
        const { query, role } = req.query;
        const currentUserId = req.user.id;

        if (!query || query.trim().length === 0) {
          return res.status(400).json({ message: 'Search query is required' });
        }

        const searchCriteria = {
          name: { $regex: query, $options: 'i' },
          user: { $ne: currentUserId },
        };

        let profiles = await Profile.find(searchCriteria).limit(20);
        res.json(profiles);
      } catch (error) {
        logger.error(`Error in searchProfiles: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },
  };
};
