const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET;

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined on server for validation.');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    logger.warn(`Token validation failed: ${error.message}`);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

exports.checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    logger.warn(`Role check failed: User ${req.user.id} with role ${req.user.role} tried to access ${req.originalUrl}`);
    return res.status(403).json({ message: 'Forbidden: You do not have the required role.' });
  }

  next();
};
