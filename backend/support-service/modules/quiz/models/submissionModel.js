const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Quiz',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    answers: {
      type: [String],
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

module.exports = submissionSchema;
