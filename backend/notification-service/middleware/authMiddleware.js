const axios = require('axios');
const logger = require('../config/logger');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

if (!AUTH_SERVICE_URL) {
  logger.error('AUTH_SERVICE_URL is not defined! This service cannot authenticate requests.');
  process.exit(1);
}

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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