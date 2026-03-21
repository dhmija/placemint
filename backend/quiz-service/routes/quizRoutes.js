const express = require('express');
const {
  createQuiz,
  getQuizForJob,
  submitQuiz,
  getQuizResults,
  getMyResult,
  getStudentResult,
  getSubmissionDetails,
} = require('../controllers/quizController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /
// @desc    Create a new quiz (Recruiter/TPO)
// @access  Private (Recruiter or Placement Cell)
router.post(
  '/',
  protect,
  checkRole(['recruiter', 'placementcell']),
  createQuiz
);

// @route   GET /job/:jobId
// @desc    Get the quiz for a specific job (Student)
// @access  Private (Student only)
router.get(
  '/job/:jobId',
  protect,
  checkRole(['student']),
  getQuizForJob
);

// @route   POST /job/:jobId/submit
// @desc    Submit answers for a quiz (Student)
// @access  Private (Student only)
router.post(
  '/job/:jobId/submit',
  protect,
  checkRole(['student']),
  submitQuiz
);

// @route   GET /job/:jobId/results
// @desc    Get scoreboard/results for a quiz (Recruiter/TPO)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/job/:jobId/results',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getQuizResults
);

// @route   GET /job/:jobId/my-result
// @desc    Get the logged-in student's own result
// @access  Private (Student only)
router.get(
  '/job/:jobId/my-result',
  protect,
  checkRole(['student']),
  getMyResult
);

// @route   GET /job/:jobId/student/:studentId
// @desc    Get a specific student's quiz result (Recruiter/TPO)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/job/:jobId/student/:studentId',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getStudentResult
);

// @route   GET /submission/:id
// @desc    Get a single student submission (for linking from scoreboard)
// @access  Private (Recruiter or Placement Cell)
router.get(
  '/submission/:id',
  protect,
  checkRole(['recruiter', 'placementcell']),
  getSubmissionDetails
);

module.exports = router;