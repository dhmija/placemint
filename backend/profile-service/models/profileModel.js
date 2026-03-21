const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    // Connects the profile to a user in the auth-service's 'User' collection
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', 
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
    },
    enrollmentNumber: {
      type: String,
      required: [true, 'Please provide your enrollment number'],
      unique: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    },
    // Stores the web-accessible path, e.g., '/uploads/resume-12345.pdf'
    resumeURL: {
      type: String,
    },
    skills: {
      type: [String],
      default: [],
    },
    gpa: {
      type: Number,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;