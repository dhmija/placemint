const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  actualOutput: String,
  passed: Boolean,
  status: String,
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
    status: {
      type: String,
      enum: ['Pending', 'Passed', 'Failed'],
      default: 'Pending',
    },
    results: [testResultSchema],
  },
  {
    timestamps: true,
  }
);

taskSubmissionSchema.index({ task: 1, student: 1 }, { unique: true });

const TaskSubmission = mongoose.model('TaskSubmission', taskSubmissionSchema);
module.exports = TaskSubmission;
