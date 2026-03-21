const express = require('express');
const {
  createTask,
  getTaskForJob,
  submitTask,
  getTaskResults,
  getMyResult,
  getStudentResult,
} = require('../controllers/taskController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /
// @desc    Create a new task (Recruiter/TPO)
// @access  Private (Recruiter or Placement Cell)
router.post(
  '/',
  protect,
  checkRole(['recruiter', 'placementcell']),
  createTask
);

// @route   GET /job/:jobId
// @desc    Get the task for a specific job (Student)
// @access  Private (Student only)
router.get(
  '/job/:jobId',
  protect,
  checkRole(['student']),
  getTaskForJob
);

// @route   POST /job/:jobId/submit
// @desc    Submit code for a task (Student)
// @access  Private (Student only)
router.post(
  '/job/:jobId/submit',
  protect,
  checkRole(['student']),
  submitTask
);

// @route   GET /job/:jobId/results
// @desc    Get scoreboard/results for a task (Recruiter/TPO)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/job/:jobId/results',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getTaskResults
);

// @route   GET /job/:jobId/my-result
// @desc    Get the logged-in student's own result for a task
// @access  Private (Student only)
router.get(
  '/job/:jobId/my-result',
  protect,
  checkRole(['student']),
  getMyResult
);

// @route   GET /job/:jobId/student/:studentId
// @desc    Get a specific student's task result (Recruiter/TPO)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/job/:jobId/student/:studentId',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getStudentResult
);

module.exports = router;