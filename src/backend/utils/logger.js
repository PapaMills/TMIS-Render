// utils/logger.js

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logDir, 'app.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logToFile = (message) => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, entry);
};

const logger = {
  info: (message) => {
    console.log(`[INFO] ${message}`);
    logToFile(`INFO: ${message}`);
  },
  error: (message) => {
    console.error(`[ERROR] ${message}`);
    logToFile(`ERROR: ${message}`);
  }
};

module.exports = logger;
