// scripts/seed-tpo.js
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Minimal User schema for seeding
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

const seedTPO = async () => {
  const { MONGO_URI_AUTH, TPO_ADMIN_EMAIL, TPO_ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI_AUTH || !TPO_ADMIN_EMAIL || !TPO_ADMIN_PASSWORD) {
    console.error('❌ Missing required environment variables:');
    if (!MONGO_URI_AUTH) console.error('  - MONGO_URI_AUTH');
    if (!TPO_ADMIN_EMAIL) console.error('  - TPO_ADMIN_EMAIL');
    if (!TPO_ADMIN_PASSWORD) console.error('  - TPO_ADMIN_PASSWORD');
    console.error('\nPlease set these in your .env file before running the seed script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI_AUTH);
    console.log('✅ Connected to Auth Database.');

    const email = TPO_ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`⚠️ TPO User already exists: ${email}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TPO_ADMIN_PASSWORD, salt);

    const tpoUser = new User({
      email,
      password: hashedPassword,
      role: 'placementcell',
      isVerified: true
    });

    await tpoUser.save();
    console.log(`✅ Successfully seeded TPO User: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding TPO User:', error);
    process.exit(1);
  }
};

seedTPO();
