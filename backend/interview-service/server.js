const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./config/logger');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', interviewRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'interview-service', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5010;

const server = app.listen(PORT, () => {
  logger.info(`Interview Service running on port ${PORT}`);
});

// Graceful shutdown on SIGTERM / SIGINT
const shutdown = () => {
  logger.info('SIGTERM/SIGINT received — shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    // allow mongoose and other resources to close if needed
    process.exit(0);
  });
  // Force exit if shutdown takes too long
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
