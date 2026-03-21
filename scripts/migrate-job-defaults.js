const mongoose = require('mongoose');
const path = require('path');

// Adjust this URI if your local MongoDB uses a different name/port
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/placement';

const Job = require(path.join(__dirname, '..', 'backend', 'job-service', 'models', 'jobModel'));

(async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for migration');

    await Job.updateMany({ site: { $exists: false } }, { $set: { site: 'Onsite' } });
    await Job.updateMany({ jobType: { $exists: false } }, { $set: { jobType: 'Intern' } });
    await Job.updateMany({ salaryRange: { $exists: false } }, { $set: { salaryRange: 'Not Disclosed' } });

    console.log('Migration complete: default fields set for existing jobs');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
