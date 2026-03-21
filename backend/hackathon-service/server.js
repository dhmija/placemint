require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const logger = require('./config/logger');

// --- Connect to Database ---
connectDB();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'hackathon-service', timestamp: new Date().toISOString() });
});

app.use('/', require('./routes/hackathonRoutes'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  logger.info(`Hackathon Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
