const express = require('express');
const {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} = require('../controllers/announcementController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /
// @desc    Get all announcements (for students)
// @access  Protected (all logged-in users)
router.get('/', protect, getAllAnnouncements);

// @route   POST /
// @desc    Create a new announcement (TPO only)
// @access  Private (Placement Cell only)
router.post(
  '/',
  protect,
  checkRole(['placementcell']),
  createAnnouncement
);

// @route   PUT /:id
// @desc    Update an announcement (TPO only)
// @access  Private (Placement Cell only)
router.put(
  '/:id',
  protect,
  checkRole(['placementcell']),
  updateAnnouncement
);

// @route   DELETE /:id
// @desc    Delete an announcement (TPO only)
// @access  Private (Placement Cell only)
router.delete(
  '/:id',
  protect,
  checkRole(['placementcell']),
  deleteAnnouncement
);

module.exports = router;