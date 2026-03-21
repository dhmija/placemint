const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');
const { redisClient } = require('../config/redisClient');
const logger = require('../config/logger');

const TPO_ADMIN_EMAIL = process.env.TPO_ADMIN_EMAIL;
const JWT_SECRET = process.env.JWT_SECRET;

//
// --- FIX APPLIED ---
// Now includes 'email' in the token
//
const generateToken = (id, role, email) => {
  if (!JWT_SECRET) {
    logger.error('JWT_SECRET is not defined! Cannot generate token.');
    throw new Error('JWT_SECRET is not defined.');
  }
  return jwt.sign({ id, role, email }, JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// Helper to generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Helper function to store in Redis
const storeInRedis = async (key, value, expirationInSeconds) => {
  await redisClient.set(key, value, {
    EX: expirationInSeconds,
  });
};

// 1. Register User
exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { email, password, role } = req.body;
  email = email.toLowerCase();

  try {
    let user = await User.findOne({ email });
    if (user) {
      logger.warn(`Registration attempt failed: Email already exists - ${email}`);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (role === 'placementcell' && email !== TPO_ADMIN_EMAIL?.toLowerCase()) {
      logger.warn(`Unauthorized 'placementcell' registration attempt: ${email}`);
      return res.status(403).json({ message: 'You are not authorized to register as a Placement Cell member.' });
    }
    
    user = new User({ email, password, role, isVerified: false });
    await user.save();
    logger.info(`New user registered: ${email}, Role: ${role}`);

    // Send OTP as part of the registration flow
    await exports.sendVerificationOTP(req, res, true); 

  } catch (error) {
    logger.error(`Error in registerUser: ${error.message}`, { email, stack: error.stack });
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// 2. Login User
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      logger.warn(`Login failed: User not found - ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Login failed: Invalid password - ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      logger.warn(`Login failed: Account not verified - ${email}`);
      // Send OTP directly without triggering the sendVerificationOTP response handler
      try {
        const otp = generateOTP();
        const otpKey = `otp:${email.toLowerCase()}`;
        await storeInRedis(otpKey, otp, 600); // 10 minutes
        const emailHtml = `<h3>Welcome to the Placement Portal!</h3><p>Your One-Time Password (OTP) for account verification is:</p><h1>${otp}</h1><p>This OTP is valid for 10 minutes.</p>`;
        await sendEmail(email, 'Placement Portal - Verify Your Email', emailHtml);
        logger.info(`Verification OTP resent during login to: ${email}`);
      } catch (otpError) {
        logger.error(`Failed to resend OTP during login attempt: ${otpError.message}`, { email });
      }
      return res.status(401).json({ message: 'Account not verified. A new OTP has been sent to your email.' });
    }

    //
    // --- FIX APPLIED ---
    // Passes 'user.email' to the token function
    //
    const token = generateToken(user.id, user.role, user.email);
    logger.info(`User logged in successfully: ${email}`);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    logger.error(`Error in loginUser: ${error.message}`, { email, stack: error.stack });
    res.status(500).json({ message: 'Server error during login' });
  }
};

// 3. Send Verification OTP
exports.sendVerificationOTP = async (req, res, isFromRegistration = false) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`OTP send failed: User not found - ${email}`);
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // Only block resend if user is already verified AND this is NOT part of a new registration
    if (user.isVerified && !isFromRegistration) {
      logger.warn(`OTP send failed: User already verified - ${email}`);
      return res.status(400).json({ message: 'This account is already verified.' });
    }

    const otp = generateOTP();
    const otpKey = `otp:${email}`;
    await storeInRedis(otpKey, otp, 600); // 10 minutes

    const emailHtml = `<h3>Welcome to the Placement Portal!</h3><p>Your One-Time Password (OTP) for account verification is:</p><h1>${otp}</h1><p>This OTP is valid for 10 minutes.</p>`;
    await sendEmail(email, 'Placement Portal - Verify Your Email', emailHtml);
    logger.info(`Verification OTP sent to: ${email}`);
    
    // If called from registration, the register function handles the response.
    if (!isFromRegistration) {
      res.status(200).json({ message: 'Verification OTP sent to your email.' });
    } else {
      // This response is sent back to the original registerUser call
      res.status(201).json({ message: 'Registration successful. An OTP has been sent to your email for verification.' });
    }

  } catch (error) {
    logger.error(`Error in sendVerificationOTP: ${error.message}`, { email, stack: error.stack });
    // If this fails during registration, the registerUser's catch block will handle it
    if (!isFromRegistration) {
      res.status(500).json({ message: 'Error sending OTP' });
    } else {
      // Re-throw error to be caught by registerUser's catch block
      throw error;
    }
  }
};

// 4. Verify OTP
exports.verifyOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp } = req.body;
  const otpKey = `otp:${email.toLowerCase()}`;

  try {
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp) {
      logger.warn(`OTP verification failed: OTP expired - ${email}`);
      return res.status(400).json({ message: 'OTP has expired or is invalid.' });
    }

    if (storedOtp !== otp) {
      logger.warn(`OTP verification failed: Invalid OTP - ${email}`);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    //
    // --- FIX APPLIED ---
    // Use a direct, robust update command
    //
    await User.updateOne({ _id: user._id }, { $set: { isVerified: true } });

    // Delete OTP from Redis
    await redisClient.del(otpKey);
    logger.info(`Account verified successfully: ${email}`);

    //
    // --- FIX APPLIED ---
    // Passes 'user.email' to the token function
    //
    const token = generateToken(user.id, user.role, user.email);
    res.status(200).json({
      message: 'Account verified successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    logger.error(`Error in verifyOTP: ${error.message}`, { email, stack: error.stack });
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// 5. Forgot Password
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      logger.warn(`Forgot password failed: User not found - ${email}`);
      // Send a 200 OK for security, so hackers can't guess valid emails
      return res.status(200).json({ message: 'If an account with this email exists, a reset OTP has been sent.' });
    }

    const otp = generateOTP();
    const resetKey = `reset-otp:${email.toLowerCase()}`;
    await storeInRedis(resetKey, otp, 600); // 10 minutes

    const emailHtml = `<h3>Password Reset Request</h3><p>Your OTP for password reset is:</p><h1>${otp}</h1><p>This OTP is valid for 10 minutes.</p>`;
    await sendEmail(email, 'Placement Portal - Password Reset OTP', emailHtml);
    logger.info(`Password reset OTP sent to: ${email}`);
    res.status(200).json({ message: 'Password reset OTP sent to your email.' });

  } catch (error) {
    logger.error(`Error in forgotPassword: ${error.message}`, { email, stack: error.stack });
    res.status(500).json({ message: 'Error sending password reset OTP' });
  }
};

// 6. Verify Password Reset OTP
exports.verifyPasswordResetOTP = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, otp } = req.body;
  const resetKey = `reset-otp:${email.toLowerCase()}`;

  try {
    const storedOtp = await redisClient.get(resetKey);
    if (!storedOtp) {
      logger.warn(`Reset OTP verification failed: OTP expired - ${email}`);
      return res.status(400).json({ message: 'OTP has expired or is invalid.' });
    }

    if (storedOtp !== otp) {
      logger.warn(`Reset OTP verification failed: Invalid OTP - ${email}`);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenKey = `reset-token:${email.toLowerCase()}`;
    await storeInRedis(tokenKey, resetToken, 600); // 10 min token
    await redisClient.del(resetKey);
    logger.info(`Password reset OTP verified: ${email}`);

    res.status(200).json({ 
      message: 'OTP verified. You can now reset your password.',
      resetToken: resetToken
    });

  } catch (error) {
    logger.error(`Error in verifyPasswordResetOTP: ${error.message}`, { email, stack: error.stack });
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// 7. Reset Password
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, token, newPassword } = req.body;
  const tokenKey = `reset-token:${email.toLowerCase()}`;

  try {
    const storedToken = await redisClient.get(tokenKey);
    if (!storedToken || storedToken !== token) {
      logger.warn(`Password reset failed: Invalid or expired token - ${email}`);
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = newPassword;
    await user.save();

    await redisClient.del(tokenKey);
    logger.info(`Password reset successfully for: ${email}`);

    res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error) {
    logger.error(`Error in resetPassword: ${error.message}`, { email, stack: error.stack });
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// 8. Validate Token (Internal Service Use)
exports.validateToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined on server for validation.');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ 
      valid: true, 
      user: {
        id: decoded.id, 
        role: decoded.role,
        email: decoded.email
      }
    });
  } catch (error) {
    logger.warn(`Token validation failed: ${error.message}`);
    res.status(401).json({ valid: false, message: 'Token is invalid' });
  }
};