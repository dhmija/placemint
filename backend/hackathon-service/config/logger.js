const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logger = {
  info: (message, metadata = {}) => {
    console.log(`[INFO] ${message}`, metadata);
  },
  error: (message, metadata = {}) => {
    console.error(`[ERROR] ${message}`, metadata);
  },
  warn: (message, metadata = {}) => {
    console.warn(`[WARN] ${message}`, metadata);
  },
  debug: (message, metadata = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, metadata);
    }
  },
};

module.exports = logger;
