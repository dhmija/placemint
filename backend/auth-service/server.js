require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redisClient');
const logger = require('./config/logger');
const { protect, checkRole } = require('./middleware/authMiddleware');

// --- Connect to Databases ---
connectDB();
connectRedis();

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Profile Database Connection ---
const MONGO_URI_PROFILE = process.env.MONGO_URI_PROFILE || process.env.MONGO_URI;
const profileDB = mongoose.createConnection(MONGO_URI_PROFILE);
profileDB.on('connected', () => logger.info('Profile DB connected'));
profileDB.on('error', (err) => logger.error(`Profile DB error: ${err.message}`));

// --- Profile Model & Controllers ---
const profileSchema = require('./modules/profile/models/profileModel');
const Profile = profileDB.model('Profile', profileSchema);
const profileController = require('./modules/profile/controllers/profileController')(Profile, logger);
const { uploadResume } = require('./modules/profile/middleware/uploadMiddleware');

// --- Routes ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.use('/', require('./routes/userRoutes'));
app.use('/profile', require('./modules/profile/routes/profileRoutes')(profileController, { protect, checkRole }, uploadResume));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  logger.info(`Auth Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});