const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
      select: false,
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    questions: [questionSchema],
    duration: {
      type: Number,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = quizSchema;
