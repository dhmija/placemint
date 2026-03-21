const mongoose = require('mongoose');

const hackathonRegistrationSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Hackathon',
    },
    teamHead: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // From auth-service
    },
    teamName: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
    },
    teamMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'User', // From auth-service
        },
        rollNumber: {
          type: String,
          required: [true, 'Please provide roll number'],
          trim: true,
        },
        role: {
          type: String,
          required: [true, 'Please provide member role'],
          trim: true,
        },
      },
    ],
    registrationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    submissionLink: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HackathonRegistration', hackathonRegistrationSchema);
