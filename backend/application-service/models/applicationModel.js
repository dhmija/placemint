const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Job', // Refers to a Job in the job-service DB
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Refers to a User in the auth-service DB
    },
    // This is the resumeURL at the time of application
    resumeURL: {
      type: String,
      required: true,
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      // --- UPDATED ---
      enum: ['Applied', 'Viewed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Hired'],
      default: 'Applied',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a student from applying to the same job twice
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;