const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      enum: ['AI Engineer', 'Machine Learning Engineer', 'iOS Developer', 'Blockchain Engineer'],
      required: true,
    },
    company: {
      type: String,
      default: 'Google',
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'abandoned'],
      default: 'ongoing',
    },
    history: [
      {
        role: {
          type: String,
          enum: ['user', 'model'],
        },
        parts: [
          {
            text: String,
          },
        ],
      },
    ],
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: String,
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    duration: Number, // in seconds
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
