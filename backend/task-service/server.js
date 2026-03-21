require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const logger = require('./config/logger');

// --- Service URL Checks ---
if (!process.env.AUTH_SERVICE_URL || !process.env.JUDGE0_API_KEY || !process.env.JUDGE0_API_HOST) {
  logger.error('Missing required service URL or API key environment variables!');
  process.exit(1);
}

// --- Connect to Database ---
connectDB();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'task-service', timestamp: new Date().toISOString() });
});

app.use('/', require('./routes/taskRoutes'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5009;
app.listen(PORT, () => {
  logger.info(`Task Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});