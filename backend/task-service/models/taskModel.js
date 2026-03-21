const mongoose = require('mongoose');

// Schema for a single test case
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true,
  },
  expectedOutput: {
    type: String,
    required: true,
  },
  // 'true' for hidden test cases, 'false' for examples
  hidden: {
    type: Boolean,
    default: true,
  },
});

const taskSchema = new mongoose.Schema(
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
    description: {
      type: String,
      required: true,
    },
    // The language for the task, using Judge0 Language IDs
    // e.g., 71 = Python, 62 = Java, 54 = C++
    languageId: {
      type: Number,
      required: true,
    },
    // Starter/boilerplate code for the student
    starterCode: {
      type: String,
    },
    testCases: [testCaseSchema],
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;