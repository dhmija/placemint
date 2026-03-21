const express = require('express');
const {
  registerUser,
  loginUser,
  sendVerificationOTP,
  verifyOTP,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  validateToken,
} = require('../controllers/userController');
const { verifyCaptcha } = require('../middleware/captchaMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    verifyCaptcha,
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    body('role', 'A valid role is required').isIn(['student', 'recruiter', 'placementcell', 'verifier']),
  ],
  registerUser
);

router.post(
  '/login',
  [
    verifyCaptcha,
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  loginUser
);

router.post(
  '/send-otp',
  [body('email', 'Please include a valid email').isEmail()],
  sendVerificationOTP
);

router.post(
  '/verify-otp',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('otp', 'OTP is required').isString().isLength({ min: 6, max: 6 }),
  ],
  verifyOTP
);

router.post(
  '/forgot-password',
  [body('email', 'Please include a valid email').isEmail()],
  forgotPassword
);

router.post(
  '/verify-reset-otp',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('otp', 'OTP is required').isString().isLength({ min: 6, max: 6 }),
  ],
  verifyPasswordResetOTP
);

router.post(
  '/reset-password',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('token', 'Reset token is required').isString(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
  ],
  resetPassword
);

router.get('/validate', validateToken);

module.exports = router;