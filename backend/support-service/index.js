require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./config/logger');
const { protect, checkRole } = require('./middleware/authMiddleware');

// --- Environment variable validation ---
if (!process.env.AUTH_SERVICE_URL) {
  logger.error('AUTH_SERVICE_URL is not defined!');
  process.exit(1);
}

if (!process.env.JUDGE0_API_KEY || !process.env.JUDGE0_API_HOST) {
  logger.warn('Judge0 environment variables not set. Task submission will fail.');
}

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Health Check Endpoint ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'support-service',
    timestamp: new Date().toISOString(),
  });
});

// --- Database Connections ---
const MONGO_URI = process.env.MONGO_URI;

// Create separate connections for each service that needs a database
let announcementDB, hackathonDB, taskDB, messagingDB, quizDB;

if (!MONGO_URI) {
  logger.error('MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

// Create connections for each module
announcementDB = mongoose.createConnection(MONGO_URI);
hackathonDB = mongoose.createConnection(MONGO_URI);
taskDB = mongoose.createConnection(MONGO_URI);
messagingDB = mongoose.createConnection(MONGO_URI);
quizDB = mongoose.createConnection(MONGO_URI);

// Log connection states
announcementDB.on('connected', () => logger.info('Announcement DB connected'));
hackathonDB.on('connected', () => logger.info('Hackathon DB connected'));
taskDB.on('connected', () => logger.info('Task DB connected'));
messagingDB.on('connected', () => logger.info('Messaging DB connected'));
quizDB.on('connected', () => logger.info('Quiz DB connected'));

announcementDB.on('error', (err) => logger.error(`Announcement DB error: ${err.message}`));
hackathonDB.on('error', (err) => logger.error(`Hackathon DB error: ${err.message}`));
taskDB.on('error', (err) => logger.error(`Task DB error: ${err.message}`));
messagingDB.on('error', (err) => logger.error(`Messaging DB error: ${err.message}`));
quizDB.on('error', (err) => logger.error(`Quiz DB error: ${err.message}`));

// --- Models for each module (define schemas for separate connections) ---

// Announcement schema
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Please provide a title'], trim: true },
  content: { type: String, required: [true, 'Please provide content'] },
  type: { type: String, enum: ['Announcement', 'Opportunity', 'Contest', 'Hackathon'], default: 'Announcement' },
  externalLink: String,
  eventDate: Date,
  location: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Announcement = announcementDB.model('Announcement', announcementSchema);

// Hackathon schema
const hackathonSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: [true, 'Please provide a hackathon title'], trim: true },
  description: { type: String, required: [true, 'Please provide a hackathon description'] },
  organization: { type: String, required: [true, 'Please provide organization name'], trim: true },
  startDate: { type: Date, required: [true, 'Please provide start date'] },
  endDate: { type: Date, required: [true, 'Please provide end date'] },
  registrationDeadline: { type: Date, required: [true, 'Please provide registration deadline'] },
  location: { type: String, default: 'Online' },
  prize: { type: String, default: 'TBD' },
  maxTeamSize: { type: Number, required: [true, 'Please provide maximum team size'], min: 1, max: 10 },
  registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HackathonRegistration' }],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Hackathon = hackathonDB.model('Hackathon', hackathonSchema);

// Hackathon Registration schema
const registrationSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Hackathon' },
  teamHead: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  teamName: { type: String, required: [true, 'Please provide a team name'], trim: true },
  teamMembers: [{ userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, rollNumber: { type: String, required: [true, 'Please provide roll number'], trim: true }, role: { type: String, required: [true, 'Please provide member role'], trim: true } }],
  registrationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submissionLink: { type: String, default: null },
}, { timestamps: true });

const HackathonRegistration = hackathonDB.model('HackathonRegistration', registrationSchema);

// Task schema
const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  hidden: { type: Boolean, default: true },
});

const taskSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  languageId: { type: Number, required: true },
  starterCode: String,
  testCases: [testCaseSchema],
}, { timestamps: true });

const Task = taskDB.model('Task', taskSchema);

// Task Submission schema
const testResultSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  actualOutput: String,
  passed: Boolean,
  status: String,
});

const taskSubmissionSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Passed', 'Failed'], default: 'Pending' },
  results: [testResultSchema],
}, { timestamps: true });

taskSubmissionSchema.index({ task: 1, student: 1 }, { unique: true });
const TaskSubmission = taskDB.model('TaskSubmission', taskSubmissionSchema);

// Conversation schema
const conversationSchema = new mongoose.Schema({
  participantIds: { type: [mongoose.Schema.Types.ObjectId], required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview', default: null },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  subject: { type: String, default: 'Interview Discussion' },
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  unreadCount: { student: { type: Number, default: 0 }, recruiter: { type: Number, default: 0 } },
}, { timestamps: true });

const Conversation = messagingDB.model('Conversation', conversationSchema);

// Message schema
const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  senderRole: { type: String, enum: ['student', 'recruiter'], required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  attachments: [{ name: String, url: String, type: String }],
}, { timestamps: true });

const Message = messagingDB.model('Message', messageSchema);

// Quiz schema
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true, select: false },
}, { _id: true });

const quizSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  questions: [questionSchema],
  duration: { type: Number, default: 60 },
}, { timestamps: true });

const Quiz = quizDB.model('Quiz', quizSchema);

// Submission schema
const submissionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Quiz' },
  student: { type: mongoose.Schema.Types.ObjectId, required: true },
  answers: { type: [String], required: true },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

submissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

const Submission = quizDB.model('Submission', submissionSchema);

// --- Controllers (Factory functions) ---
const announcementController = require('./modules/announcements/controllers/announcementController')(
  Announcement,
  logger
);

const hackathonController = require('./modules/hackathons/controllers/hackathonController')(
  Hackathon,
  logger
);

const taskController = require('./modules/tasks/controllers/taskController')(
  Task,
  TaskSubmission,
  logger
);

const conversationController = require('./modules/messaging/controllers/conversationController')(
  Conversation,
  Message,
  logger
);

const messageController = require('./modules/messaging/controllers/messageController')(
  Message,
  Conversation,
  logger
);

const skillsController = require('./modules/skills/controllers/skillsController')(logger);

const quizController = require('./modules/quiz/controllers/quizController')(
  Quiz,
  Submission,
  logger
);

// --- Route Mounting ---

// Announcements routes
app.use('/announcements', require('./modules/announcements/routes/announcementRoutes')(
  announcementController,
  { protect, checkRole }
));

// Hackathons routes
app.use('/hackathons', require('./modules/hackathons/routes/hackathonRoutes')(
  hackathonController,
  { protect, checkRole }
));

// Tasks routes
app.use('/tasks', require('./modules/tasks/routes/taskRoutes')(
  taskController,
  { protect, checkRole }
));

// Messaging routes
app.use('/messaging', require('./modules/messaging/routes/messagingRoutes')(
  conversationController,
  messageController,
  { protect }
));

// Quiz routes
app.use('/quiz', require('./modules/quiz/routes/quizRoutes')(
  quizController,
  { protect, checkRole }
));

// Skills routes (stateless, no DB required)
app.use('/skills', require('./modules/skills/routes/skillsRoutes')(skillsController));

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  logger.info(`Support Service running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
