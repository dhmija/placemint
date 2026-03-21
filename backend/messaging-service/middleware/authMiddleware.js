const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Middleware to verify JWT token
const protect = (req, res, next) => {
  logger.info('POST ' + req.path);
  logger.info('--- authMiddleware Protect invoked ---');
  logger.info('Headers: ' + JSON.stringify(req.headers));
  logger.info('Body: ' + JSON.stringify(req.body));

  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    logger.error('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    logger.info('Protect middleware headers: ' + JSON.stringify(req.headers));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    logger.info('User authenticated:', decoded);
    next();
  } catch (err) {
    logger.error('Token verification failed:', err.message);
    res.status(401).json({ error: 'Token verification failed' });
  }
};

module.exports = { protect };
