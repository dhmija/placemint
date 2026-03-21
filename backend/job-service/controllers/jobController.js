const Job = require('../models/jobModel');
const logger = require('../config/logger');

// Get all jobs (supports optional query filters)
exports.getAllJobs = async (req, res) => {
  try {
    const { role, jobType, site, salaryRange } = req.query;
    const filter = {};

    if (role) {
      filter.$or = [
        { title: new RegExp(role, 'i') },
        { role: new RegExp(role, 'i') }
      ];
    }
    if (jobType && jobType !== 'All') filter.jobType = jobType;
    if (site && site !== 'All') filter.site = site;
    if (salaryRange && salaryRange !== 'All') filter.salaryRange = salaryRange;

    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    logger.error(`Error in getAllJobs: ${error.message}`, { stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get jobs posted by the current user
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    logger.error(`Error in getMyJobs: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      logger.warn(`Job not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    // Handle invalid ObjectId error
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    logger.error(`Error in getJobById: ${error.message}`, { jobId: req.params.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new job
exports.createJob = async (req, res) => {
  // Now includes 'quiz', 'task', 'site', 'jobType', 'salaryRange'
  const { title, company, description, salary, location, quiz, task, site, jobType, salaryRange } = req.body;
  try {
    const newJob = new Job({
      title,
      company,
      description,
      salary,
      location,
      site: site || undefined,
      jobType: jobType || undefined,
      salaryRange: salaryRange || undefined,
      quiz: quiz || null, // Add the quiz ID, or null
      task: task || null, // Add the task ID, or null
      user: req.user.id, // Set the user from the 'protect' middleware
    });

    const job = await newJob.save();
    logger.info(`New job created: ${job.id} by user ${req.user.id}`);
    res.status(201).json(job);
  } catch (error) {
    logger.error(`Error in createJob: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a job
exports.updateJob = async (req, res) => {
  // Now includes 'quiz', 'task', 'site', 'jobType', 'salaryRange'
  const { title, company, description, salary, location, quiz, task, site, jobType, salaryRange } = req.body;
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      logger.warn(`Update job failed: Job not found - ${req.params.id}`);
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the owner OR is from the placement cell
    if (job.user.toString() !== req.user.id && req.user.role !== 'placementcell') {
      logger.warn(`User ${req.user.id} forbidden to update job ${job.id}`);
      return res.status(403).json({ message: 'User not authorized to update this job' });
    }

    // Update fields
    job.title = title || job.title;
    job.company = company || job.company;
    job.description = description || job.description;
    job.salary = salary || job.salary;
    job.location = location || job.location;
    job.site = (typeof site !== 'undefined') ? site : job.site;
    job.jobType = (typeof jobType !== 'undefined') ? jobType : job.jobType;
    job.salaryRange = (typeof salaryRange !== 'undefined') ? salaryRange : job.salaryRange;
    job.quiz = quiz || job.quiz; // Update the quiz ID
    job.task = task || job.task; // Update the task ID

    const updatedJob = await job.save();
    logger.info(`Job updated: ${updatedJob.id} by user ${req.user.id}`);
    res.json(updatedJob);

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    logger.error(`Error in updateJob: ${error.message}`, { jobId: req.params.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      logger.warn(`Delete job failed: Job not found - ${req.params.id}`);
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the owner OR is from the placement cell
    if (job.user.toString() !== req.user.id && req.user.role !== 'placementcell') {
      logger.warn(`User ${req.user.id} forbidden to delete job ${job.id}`);
      return res.status(403).json({ message: 'User not authorized to delete this job' });
    }
    
    // We will also need to delete associated quizzes, tasks, and submissions.
    // For now, we just delete the job. A more robust solution would use
    // event-driven communication to tell other services to clean up.
    
    await job.deleteOne(); 
    logger.info(`Job deleted: ${job.id} by user ${req.user.id}`);
    res.json({ message: 'Job removed successfully' });

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Job not found' });
    }
    logger.error(`Error in deleteJob: ${error.message}`, { jobId: req.params.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};