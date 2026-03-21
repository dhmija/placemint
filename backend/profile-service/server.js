require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Import the 'path' module
const connectDB = require('./config/db');
const logger = require('./config/logger');

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

// --- Static Folder for Uploads ---
// This serves files from the 'uploads' directory, making them web-accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'profile-service', timestamp: new Date().toISOString() });
});

app.use('/', require('./routes/profileRoutes'));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  logger.info(`Profile Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});