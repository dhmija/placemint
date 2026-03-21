const fs = require('fs');
const path = require('path');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const timestamp = () => new Date().toISOString().split('T')[1].split('.')[0];
const date = () => new Date().toISOString().split('T')[0];

const logger = {
  info: (message) => {
    const logMessage = `${date()} ${timestamp()}: info: ${message}`;
    console.log(logMessage);
    fs.appendFileSync(path.join(logDir, `interview-${date()}.log`), logMessage + '\n');
  },
  error: (message) => {
    const logMessage = `${date()} ${timestamp()}: error: ${message}`;
    console.error(logMessage);
    fs.appendFileSync(path.join(logDir, `interview-${date()}.log`), logMessage + '\n');
  },
  warn: (message) => {
    const logMessage = `${date()} ${timestamp()}: warn: ${message}`;
    console.warn(logMessage);
    fs.appendFileSync(path.join(logDir, `interview-${date()}.log`), logMessage + '\n');
  },
};

module.exports = logger;
