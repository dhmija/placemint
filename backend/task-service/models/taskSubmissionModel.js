const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  actualOutput: String,
  passed: Boolean,
  status: String, // e.g., "Accepted", "Wrong Answer", "Time Limit Exceeded"
});

const taskSubmissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    // Final status: 'Passed' or 'Failed'
    status: {
      type: String,
      enum: ['Pending', 'Passed', 'Failed'],
      default: 'Pending',
    },
    // Array of results from all hidden test cases
    results: [testResultSchema],
  },
  {
    timestamps: true,
  }
);

// Prevent a student from submitting to the same task twice
taskSubmissionSchema.index({ task: 1, student: 1 }, { unique: true });

const TaskSubmission = mongoose.model('TaskSubmission', taskSubmissionSchema);
module.exports = TaskSubmission;