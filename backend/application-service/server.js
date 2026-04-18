require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const logger = require('./config/logger');

// --- Service URL Checks ---
if (!process.env.AUTH_SERVICE_URL || !process.env.JOB_SERVICE_URL) {
  logger.error('Missing required service URL environment variables!');
  process.exit(1);
}

// --- Connect to Database ---
connectDB();

const app = express();

// --- Middleware ---
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Student-Id'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Routes ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'application-service', timestamp: new Date().toISOString() });
});

app.use('/', require('./routes/applicationRoutes'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  logger.info(`Application Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});