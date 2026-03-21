const express = require('express');
const {
  getAllJobs,
  getMyJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /
// @desc    Get all job listings
// @access  Protected (all logged-in users)
router.get('/', protect, getAllJobs);

// @route   GET /myjobs
// @desc    Get all jobs posted by the logged-in recruiter/admin
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/myjobs',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getMyJobs
);

// @route   GET /:id
// @desc    Get a single job by its ID
// @access  Protected
router.get('/:id', protect, getJobById);

// @route   POST /
// @desc    Create a new job listing
// @access  Private (Recruiter or Placement Cell)
router.post(
  '/',
  protect,
  checkRole(['recruiter', 'placementcell']),
  createJob
);

// @route   PUT /:id
// @desc    Update a job listing
// @access  Private (Owner, or Placement Cell)
router.put(
  '/:id',
  protect,
  checkRole(['recruiter', 'placementcell']),
  updateJob
);

// @route   DELETE /:id
// @desc    Delete a job listing
// @access  Private (Owner, or Placement Cell)
router.delete(
  '/:id',
  protect,
  checkRole(['recruiter', 'placementcell']),
  deleteJob
);

module.exports = router;