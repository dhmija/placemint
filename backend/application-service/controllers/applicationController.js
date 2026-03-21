const Application = require('../models/applicationModel');
const logger = require('../config/logger');
const axios = require('axios');

// URLs for internal service communication
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL;
const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;

// Helper to create an authenticated axios instance
const createAuthAxios = (token) => {
  return axios.create({
    headers: {
      Authorization: `${token}`, // Assumes token is already "Bearer ..."
    },
  });
};

// Helper function to "fire and forget" a notification
const sendNotification = (token, userId, message, link) => {
  if (!NOTIFICATION_SERVICE_URL) return; // Do nothing if service isn't configured

  createAuthAxios(token)
    .post(`${NOTIFICATION_SERVICE_URL}/internal/create`, {
      user: userId,
      message: message,
      relatedLink: link,
    })
    .catch((err) => {
      // We log the error but don't stop the main request
      logger.error(`Failed to send notification: ${err.message}`, { userId });
    });
};

// 1. Apply to a job
exports.applyToJob = async (req, res) => {
  const { jobId } = req.params;
  const studentId = req.user.id;
  const token = req.headers.authorization;

  try {
    const authAxios = createAuthAxios(token);

    // --- Step 1: Check if job exists (call job-service) ---
    let job;
    try {
      const jobResponse = await authAxios.get(`${JOB_SERVICE_URL}/${jobId}`);
      job = jobResponse.data;
    } catch (err) {
      logger.warn(`Apply failed: Job not found - ${jobId}`, { studentId });
      return res.status(404).json({ message: 'Job not found.' });
    }

    // --- Step 2: Get student's profile (call profile-service) ---
    let profile;
    try {
      const profileResponse = await authAxios.get(`${PROFILE_SERVICE_URL}/me`);
      profile = profileResponse.data;
    } catch (err) {
      logger.warn(`Apply failed: Profile not found for user ${studentId}`);
      return res.status(404).json({ message: 'You must create a profile before applying.' });
    }

    if (!profile.resumeURL) {
      logger.warn(`Apply failed: No resume for user ${studentId}`);
      return res.status(400).json({ message: 'You must upload a resume to your profile before applying.' });
    }

    // --- Step 3: Create the application ---
    const newApplication = new Application({
      job: jobId,
      student: studentId,
      resumeURL: profile.resumeURL, // Snapshot the resume URL
      coverLetter: req.body.coverLetter || '',
    });

    await newApplication.save();
    logger.info(`New application created for job ${jobId} by student ${studentId}`);

    // --- Step 4: Send notification to job poster (fire and forget) ---
    const notificationMsg = `New application for your job "${job.title}" from ${profile.name}.`;
    sendNotification(token, job.user, notificationMsg, `/admin/job/applicants/${jobId}`);

    res.status(201).json(newApplication);

  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate application error
      logger.warn(`Apply failed: User ${studentId} already applied to job ${jobId}`);
      return res.status(400).json({ message: 'You have already applied to this job.' });
    }
    logger.error(`Error in applyToJob: ${error.message}`, { studentId, jobId, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get all applications for the logged-in student
exports.getMyApplications = async (req, res) => {
  const studentId = req.user.id;
  const token = req.headers.authorization;

  try {
    // --- Step 1: Get all applications from this DB ---
    const applications = await Application.find({ student: studentId })
      .sort({ createdAt: -1 })
      .lean(); // .lean() for faster, plain JS objects

    if (applications.length === 0) {
      return res.json([]);
    }

    // --- Step 2: Get job details for each application (call job-service) ---
    const authAxios = createAuthAxios(token);
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        try {
          const jobRes = await authAxios.get(`${JOB_SERVICE_URL}/${app.job}`);
          return { ...app, jobDetails: jobRes.data }; // Combine application and job data
        } catch (err) {
          logger.warn(`Could not fetch job details for job ${app.job}`);
          return { ...app, jobDetails: null }; // Return application even if job was deleted
        }
      })
    );

    res.json(enrichedApplications);

  } catch (error) {
    logger.error(`Error in getMyApplications: ${error.message}`, { studentId, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get all applications for a specific job (for scoreboard)
exports.getApplicationsForJob = async (req, res) => {
  const { jobId } = req.params;
  const token = req.headers.authorization;

  try {
    // --- Step 1: Verify this recruiter/TPO owns the job (or is TPO) ---
    const authAxios = createAuthAxios(token);
    let job;
    try {
      const jobResponse = await authAxios.get(`${JOB_SERVICE_URL}/${jobId}`);
      job = jobResponse.data;
    } catch (err) {
      logger.warn(`Get applications failed: Job not found - ${jobId}`);
      return res.status(404).json({ message: 'Job not found.' });
    }

    if (job.user.toString() !== req.user.id && req.user.role !== 'placementcell') {
      logger.warn(`Forbidden: User ${req.user.id} tried to access applications for job ${jobId}`);
      return res.status(403).json({ message: 'You are not authorized to view applications for this job.' });
    }

    // --- Step 2: Get all applications from this DB ---
    const applications = await Application.find({ job: jobId })
      .sort({ createdAt: -1 })
      .lean();

    // --- Step 3: Get profile details for each applicant (call profile-service) ---
    // This data will be used to populate the scoreboard on the frontend
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        try {
          // Use the internal /user/:userId route
          const profileRes = await authAxios.get(`${PROFILE_SERVICE_URL}/user/${app.student}`);
          return { ...app, studentProfile: profileRes.data };
        } catch (err) {
          logger.warn(`Could not fetch profile for student ${app.student}`);
          return { ...app, studentProfile: null }; // Return application even if profile is missing
        }
      })
    );

    res.json(enrichedApplications);

  } catch (error) {
    logger.error(`Error in getApplicationsForJob: ${error.message}`, { jobId, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Get a single application by ID
exports.getApplicationById = async (req, res) => {
  const { id } = req.params; // Application ID
  const token = req.headers.authorization;

  try {
    const application = await Application.findById(id).lean();
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // --- Step 1: Verify authority (check job owner or TPO) ---
    const authAxios = createAuthAxios(token);
    let job;
    try {
      const jobResponse = await authAxios.get(`${JOB_SERVICE_URL}/${application.job}`);
      job = jobResponse.data;
    } catch (err) {
      return res.status(404).json({ message: 'Associated job not found.' });
    }

    if (job.user.toString() !== req.user.id && req.user.role !== 'placementcell') {
      logger.warn(`Forbidden: User ${req.user.id} tried to access application ${id}`);
      return res.status(403).json({ message: 'You are not authorized to view this application.' });
    }

    // --- Step 2: Enrich with student profile data ---
    let profile;
    try {
      const profileRes = await authAxios.get(`${PROFILE_SERVICE_URL}/user/${application.student}`);
      profile = profileRes.data;
    } catch (err) {
      logger.warn(`Could not fetch profile for student ${application.student}`);
      profile = null;
    }

    res.json({ ...application, studentProfile: profile, jobDetails: job });

  } catch (error) {
    logger.error(`Error in getApplicationById: ${error.message}`, { appId: id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Update application status
exports.updateApplicationStatus = async (req, res) => {
  const { id } = req.params; // This is the application ID
  const { status } = req.body;
  const token = req.headers.authorization;
  
  // --- UPDATED ---
  const validStatuses = ['Applied', 'Viewed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Hired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  try {
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    // --- Step 1: Verify authority (check job owner or TPO) ---
    const authAxios = createAuthAxios(token);
    let job;
    try {
      const jobResponse = await authAxios.get(`${JOB_SERVICE_URL}/${application.job}`);
      job = jobResponse.data;
    } catch (err) {
      return res.status(404).json({ message: 'Associated job not found.' });
    }

    if (job.user.toString() !== req.user.id && req.user.role !== 'placementcell') {
      logger.warn(`Forbidden: User ${req.user.id} tried to update status for application ${id}`);
      return res.status(403).json({ message: 'You are not authorized to update this application.' });
    }

    // --- Step 2: Update the status ---
    application.status = status;
    await application.save();
    logger.info(`Application ${id} status updated to ${status} by user ${req.user.id}`);

    // --- Step 3: Send notification to student (fire and forget) ---
    const notificationMsg = `Your application status for "${job.title}" has been updated to ${status}.`;
    sendNotification(token, application.student, notificationMsg, '/my-applications');

    res.json(application);

  } catch (error) {
    logger.error(`Error in updateApplicationStatus: ${error.message}`, { appId: id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Get application by Job ID and Student ID (for scoreboard link)
exports.getApplicationByJobAndStudent = async (req, res) => {
  const { jobId, studentId } = req.params;
  const token = req.headers.authorization;

  try {
    // Check authority first (same as getApplicationsForJob)
    const authAxios = createAuthAxios(token);
    let job;
    try {
      const jobResponse = await authAxios.get(`${JOB_SERVICE_URL}/${jobId}`);
      job = jobResponse.data;
    } catch (err) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    if (job.user.toString() !== req.user.id && req.user.role !== 'placementcell') {
      return res.status(403).json({ message: 'You are not authorized to view applications for this job.' });
    }

    // Find the specific application
    const application = await Application.findOne({ job: jobId, student: studentId }).lean();
    if (!application) {
      return res.status(404).json({ message: 'This student has taken the quiz but not submitted an application yet.' });
    }
    
    // Enrich with student profile
    let profile;
    try {
      const profileRes = await authAxios.get(`${PROFILE_SERVICE_URL}/user/${application.student}`);
      profile = profileRes.data;
    } catch (err) {
      profile = null;
    }

    res.json({ ...application, studentProfile: profile, jobDetails: job });

  } catch (error) {
    logger.error(`Error in getApplicationByJobAndStudent: ${error.message}`, { jobId, studentId, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};