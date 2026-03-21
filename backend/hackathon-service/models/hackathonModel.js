const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema(
  {
    // The TPO/admin who posted the hackathon
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // From auth-service
    },
    title: {
      type: String,
      required: [true, 'Please provide a hackathon title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a hackathon description'],
    },
    organization: {
      type: String,
      required: [true, 'Please provide organization name'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Please provide registration deadline'],
    },
    location: {
      type: String,
      default: 'Online',
    },
    prize: {
      type: String,
      default: 'TBD',
    },
    maxTeamSize: {
      type: Number,
      required: [true, 'Please provide maximum team size'],
      min: 1,
      max: 10,
    },
    registrations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HackathonRegistration',
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hackathon', hackathonSchema);
