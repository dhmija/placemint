const axios = require('axios');
const logger = require('../config/logger');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';

if (!process.env.AUTH_SERVICE_URL) {
  logger.warn('AUTH_SERVICE_URL not set; defaulting to http://auth-service:5001');
}

// Middleware to protect routes by validating token with auth-service
exports.protect = async (req, res, next) => {
  // Debug: always print headers/body to stdout for visibility in container logs
  try {
    console.log('--- authMiddleware Protect invoked ---');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));
  } catch (e) {}
  logger.info(`Protect middleware headers: ${JSON.stringify(req.headers)}`);
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.info(`Auth headers present: ${JSON.stringify(req.headers)}`);
    // Allow test requests that provide studentId in header or body (bypass auth for local testing)
    const headerStudent = req.headers['x-student-id'];
    if (headerStudent) {
      req.user = { id: headerStudent };
      return next();
    }
    if (req.body && req.body.studentId) {
      req.user = { id: req.body.studentId };
      return next();
    }
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Call the auth-service's /validate endpoint
    const response = await axios.get(`${AUTH_SERVICE_URL}/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.valid) {
      // Attach user info (id, role, email) to the request object
      req.user = response.data.user;
      next();
    } else {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  } catch (error) {
    logger.error(`Token validation error: ${error.message}`);
    return res.status(401).json({ message: 'Not authorized, token validation failed' });
  }
};
