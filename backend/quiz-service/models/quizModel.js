const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: [v => v.length >= 2, 'At least two options are required.'],
  },
  // The correct answer is the 0-based index of the options array
  correctAnswer: {
    type: Number,
    required: true,
    select: false, // --- IMPORTANT: Do not send answers to students
  },
});

const quizSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

// When a student fetches a quiz, we must hide the correct answers
quizSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.questions) {
    obj.questions.forEach((q) => {
      delete q.correctAnswer;
    });
  }
  return obj;
};

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;