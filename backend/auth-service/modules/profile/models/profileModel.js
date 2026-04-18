const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
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

module.exports = profileSchema;
