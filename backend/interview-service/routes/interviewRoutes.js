const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

// Start a new interview
router.post('/start', protect, interviewController.startInterview);

// Handle student answer
router.post('/answer', protect, interviewController.handleStudentAnswer);

// End interview
router.post('/end', protect, interviewController.endInterview);

// Get interview by ID
router.get('/:interviewId', protect, interviewController.getInterview);

// Get all interviews for a student
router.get('/student/:studentId', protect, interviewController.getStudentInterviews);

module.exports = router;
