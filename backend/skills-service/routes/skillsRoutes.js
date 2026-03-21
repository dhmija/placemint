const express = require('express');
const { getSkills } = require('../controllers/skillsController');

const router = express.Router();

// @route   GET /
// @desc    Get a list of skills
// @access  Public
router.get('/', getSkills);

module.exports = router;