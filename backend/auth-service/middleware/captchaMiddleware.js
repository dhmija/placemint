const axios = require('axios');
const logger = require('../config/logger');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

const verifyCaptcha = async (req, res, next) => {
  const { captchaToken } = req.body;

  // --- FIX: Allow bypass via environment variable for testing ---
  if (process.env.SKIP_CAPTCHA_VERIFICATION === 'true') {
    logger.info('CAPTCHA verification bypassed (SKIP_CAPTCHA_VERIFICATION enabled)');
    return next();
  }

  if (!captchaToken) {
    logger.warn('CAPTCHA token missing');
    return res.status(400).json({ message: 'CAPTCHA token is required.' });
  }

  if (!RECAPTCHA_SECRET_KEY) {
    logger.error('RECAPTCHA_SECRET_KEY is not set.');
    return res.status(500).json({ message: 'reCAPTCHA is not configured on the server.' });
  }

  try {
    const response = await axios.post(
      `${RECAPTCHA_VERIFY_URL}?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      {},
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
      }
    );

    const { success, 'error-codes': errorCodes } = response.data;

    if (success) {
      logger.info('CAPTCHA verified successfully');
      next();
    } else {
      logger.warn(`CAPTCHA verification failed: ${errorCodes.join(', ')}`);
      return res.status(400).json({
        message: 'Failed to verify CAPTCHA. Please try again.',
        errors: errorCodes,
      });
    }
  } catch (error) {
    logger.error(`Error verifying CAPTCHA: ${error.message}`);
    return res.status(500).json({ message: 'Error verifying CAPTCHA.' });
  }
};

module.exports = { verifyCaptcha };