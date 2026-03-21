const express = require('express');
const {
  getMyProfile,
  createOrUpdateProfile,
  getAllProfiles,
  getProfileByUserId,
  searchProfiles,
} = require('../controllers/profileController');
const { protect, checkRole } = require('../middleware/authMiddleware');
const { uploadResume } = require('../middleware/uploadMiddleware');

const router = express.Router();

// @route   GET /me
// @desc    Get the profile for the currently logged-in user
// @access  Private
router.get('/me', protect, getMyProfile);

// @route   GET /search
// @desc    Search for profiles by name
// @access  Private
// @query   ?query=name&role=recruiter (role is optional)
router.get('/search', protect, searchProfiles);

// @route   POST /
// @desc    Create or update the user's profile
// @access  Private
// @note    Uses two middleware: 'protect' first, then 'uploadResume'
router.post('/', protect, uploadResume, createOrUpdateProfile);

// @route   GET /all
// @desc    Get all student profiles
// @access  Private (Placement Cell only)
router.get('/all', protect, checkRole(['placementcell']), getAllProfiles);

// @route   GET /user/:userId
// @desc    Get a profile by user ID (for internal service communication)
// @access  Private
router.get('/user/:userId', protect, getProfileByUserId);

module.exports = router;