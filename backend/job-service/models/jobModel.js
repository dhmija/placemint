const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    // The recruiter or admin who posted the job
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // From auth-service
    },
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    salary: {
      type: String,
      default: 'Not Disclosed',
    },
    location: {
      type: String,
      default: 'Remote',
    },
    site: {
      type: String,
      enum: ['Online', 'Onsite', 'Hybrid'],
      default: 'Onsite',
    },
    jobType: {
      type: String,
      enum: ['Intern', 'Full Time', 'Part Time', 'Contract'],
      default: 'Intern',
    },
    salaryRange: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Not Disclosed'],
      default: 'Not Disclosed',
    },
    
    // --- NEW FEATURES ---
    // Link to a quiz in the quiz-service
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz', // From quiz-service
      default: null,
    },
    // Link to a task in the task-service
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task', // From task-service
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;