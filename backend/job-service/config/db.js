const mongoose = require('mongoose');
const logger = require('./logger');

const dbURI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    if (!dbURI) {
      throw new Error('MONGO_URI_JOB is not defined in environment variables.');
    }
    const conn = await mongoose.connect(dbURI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;