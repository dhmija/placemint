const express = require('express');
const {
  getAllHackathons,
  getActiveHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
} = require('../controllers/hackathonController');
const {
  registerTeam,
  getHackathonRegistrations,
  getUserRegistrations,
  getRegistrationById,
  updateRegistration,
  approveRegistration,
  rejectRegistration,
  cancelRegistration,
} = require('../controllers/registrationController');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

// ==================== HACKATHON ROUTES ====================

// @route   GET /
// @desc    Get all hackathons
// @access  Protected (all logged-in users)
router.get('/', protect, getAllHackathons);

// @route   GET /active
// @desc    Get only active hackathons (upcoming and ongoing)
// @access  Protected (all logged-in users)
router.get('/active', protect, getActiveHackathons);

// @route   GET /:id
// @desc    Get a single hackathon by its ID
// @access  Protected (all logged-in users)
router.get('/:id', protect, getHackathonById);

// @route   POST /create
// @desc    Create a new hackathon
// @access  Private (TPO/Admin only)
router.post('/create', protect, checkRole(['placementcell']), createHackathon);

// @route   PUT /:id
// @desc    Update a hackathon
// @access  Private (TPO/Admin only)
router.put('/:id', protect, checkRole(['placementcell']), updateHackathon);

// @route   DELETE /:id
// @desc    Delete a hackathon
// @access  Private (TPO/Admin only)
router.delete('/:id', protect, checkRole(['placementcell']), deleteHackathon);

// ==================== REGISTRATION ROUTES ====================

// @route   GET /registrations/my
// @desc    Get user's hackathon registrations
// @access  Protected (students)
router.get('/registrations/my', protect, getUserRegistrations);

// @route   GET /registrations/:id
// @desc    Get a single registration by ID
// @access  Protected
router.get('/registrations/:id', protect, getRegistrationById);

// @route   PUT /registrations/:id
// @desc    Update a registration
// @access  Protected (team head only)
router.put('/registrations/:id', protect, updateRegistration);

// @route   POST /registrations/:id/approve
// @desc    Approve a team registration
// @access  Private (TPO/Admin only)
router.post('/registrations/:id/approve', protect, checkRole(['placementcell']), approveRegistration);

// @route   POST /registrations/:id/reject
// @desc    Reject a team registration
// @access  Private (TPO/Admin only)
router.post('/registrations/:id/reject', protect, checkRole(['placementcell']), rejectRegistration);

// @route   DELETE /registrations/:id
// @desc    Cancel a team registration
// @access  Protected (team head only)
router.delete('/registrations/:id', protect, cancelRegistration);

// @route   POST /:hackathonId/register
// @desc    Register a team for a hackathon
// @access  Protected (students)
router.post('/:hackathonId/register', protect, registerTeam);

// @route   GET /:hackathonId/registrations
// @desc    Get all registrations for a hackathon
// @access  Private (TPO/Admin only)
router.get('/:hackathonId/registrations', protect, checkRole(['placementcell']), getHackathonRegistrations);

module.exports = router;
