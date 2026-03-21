const express = require('express');
const {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  getApplicationById,
  updateApplicationStatus,
  getApplicationByJobAndStudent,
} = require('../controllers/applicationController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /job/:jobId/apply
// @desc    Apply to a job
// @access  Private (Student only)
router.post(
  '/job/:jobId/apply',
  protect,
  checkRole(['student']),
  applyToJob
);

// @route   GET /my-applications
// @desc    Get all applications for the logged-in student
// @access  Private (Student only)
router.get(
  '/my-applications',
  protect,
  checkRole(['student']),
  getMyApplications
);

// @route   GET /job/:jobId
// @desc    Get all applications for a specific job (for scoreboard)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/job/:jobId',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getApplicationsForJob
);

// @route   GET /job/:jobId/student/:studentId
// @desc    Get a specific application by Job and Student ID (for scoreboard link)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/job/:jobId/student/:studentId',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getApplicationByJobAndStudent
);


// @route   GET /:id
// @desc    Get a single application by its ID
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/:id',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getApplicationById
);

// @route   PUT /:id/status
// @desc    Update the status of an application
// @access  Private (Recruiter or Placement Cell)
router.put(
  '/:id/status',
  protect,
  checkRole(['recruiter', 'placementcell']),
  updateApplicationStatus
);

module.exports = router;