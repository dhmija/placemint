const Quiz = require('../models/quizModel');
const Submission = require('../models/submissionModel');
const logger = require('../config/logger');
const axios = require('axios');

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL;
const APPLICATION_SERVICE_URL = process.env.APPLICATION_SERVICE_URL;

// Helper to create an authenticated axios instance
const createAuthAxios = (token) => {
  return axios.create({
    headers: {
      Authorization: `${token}`, // Assumes token is "Bearer ..."
    },
  });
};

// 1. Create Quiz
exports.createQuiz = async (req, res) => {
  const { job, title, questions } = req.body;

  try {
    // Note: We'd normally check if the user (from req.user) owns the job.
    // We can do this by calling the job-service.
    
    // For now, we'll assume the frontend only allows this for valid jobs.
    // A more robust check would be:
    // const authAxios = createAuthAxios(req.headers.authorization);
    // const jobRes = await authAxios.get(`${JOB_SERVICE_URL}/${job}`);
    // if (jobRes.data.user !== req.user.id && req.user.role !== 'placementcell') {
    //   return res.status(403).json({ message: 'Not authorized' });
    // }
    
    // Check if a quiz for this job already exists
    let quiz = await Quiz.findOne({ job: job });

    if (quiz) {
      // Update existing quiz
      quiz.title = title;
      quiz.questions = questions;
      logger.info(`Quiz updated for job ${job} by user ${req.user.id}`);
    } else {
      // Create new quiz
      quiz = new Quiz({
        job,
        title,
        questions,
      });
      logger.info(`New quiz created for job ${job} by user ${req.user.id}`);
    }
    
    await quiz.save();
    
    // We send back the full quiz object (with answers) to the creator
    const fullQuiz = await Quiz.findById(quiz._id).select('+questions.correctAnswer');
    res.status(201).json(fullQuiz);

  } catch (error) {
    logger.error(`Error creating/updating quiz: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get Quiz For Job (for Student)
exports.getQuizForJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    // Check if student already took the quiz
    const existingSubmission = await Submission.findOne({
      job: jobId,
      student: req.user.id,
    });

    if (existingSubmission) {
      logger.warn(`Student ${req.user.id} tried to retake quiz for job ${jobId}`);
      return res.status(403).json({ message: 'You have already submitted this quiz.' });
    }

    // Find the quiz. The .toJSON() method will hide correct answers.
    const quiz = await Quiz.findOne({ job: jobId });
    if (!quiz) {
      return res.status(404).json({ message: 'No quiz found for this job.' });
    }

    res.json(quiz);
  } catch (error) {
    logger.error(`Error getting quiz: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Submit Quiz
exports.submitQuiz = async (req, res) => {
  const { jobId } = req.params;
  const { answers } = req.body; // Expects an array of numbers, e.g., [0, 2, 1]

  try {
    // Get the quiz with the correct answers
    const quiz = await Quiz.findOne({ job: jobId }).select('+questions.correctAnswer');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Check for existing submission
    const existingSubmission = await Submission.findOne({
      quiz: quiz._id,
      student: req.user.id,
    });
    if (existingSubmission) {
      return res.status(403).json({ message: 'You have already submitted this quiz.' });
    }

    // Calculate score
    let score = 0;
    const totalQuestions = quiz.questions.length;
    for (let i = 0; i < totalQuestions; i++) {
      if (answers[i] === quiz.questions[i].correctAnswer) {
        score++;
      }
    }

    // Save the submission
    const newSubmission = new Submission({
      quiz: quiz._id,
      job: jobId,
      student: req.user.id,
      answers,
      score,
      totalQuestions,
    });

    await newSubmission.save();
    logger.info(`New quiz submission for job ${jobId} by student ${req.user.id}. Score: ${score}/${totalQuestions}`);

    res.status(201).json({
      message: 'Quiz submitted successfully!',
      score,
      totalQuestions,
      submissionId: newSubmission._id
    });

  } catch (error) {
    logger.error(`Error submitting quiz: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Get Quiz Results (Scoreboard for Recruiter/TPO)
exports.getQuizResults = async (req, res) => {
  const { jobId } = req.params;
  const token = req.headers.authorization;
  
  try {
    // Get all submissions for this job
    const submissions = await Submission.find({ job: jobId })
      .sort({ score: -1, createdAt: 1 }) // Highest score first, then fastest
      .lean();

    if (submissions.length === 0) {
      return res.json([]);
    }

    // --- Enrich with student profile data for the scoreboard ---
    const authAxios = createAuthAxios(token);
    const scoreboard = await Promise.all(
      submissions.map(async (submission) => {
        let studentProfile = null;
        try {
          const profileRes = await authAxios.get(`${PROFILE_SERVICE_URL}/user/${submission.student}`);
          studentProfile = profileRes.data;
        } catch (err) {
          logger.warn(`Could not fetch profile for student ${submission.student}`);
        }
        
        return {
          submissionId: submission._id,
          studentId: submission.student,
          studentName: studentProfile?.name || 'Unknown',
          enrollmentNumber: studentProfile?.enrollmentNumber || 'N/A',
          score: submission.score,
          totalQuestions: submission.totalQuestions,
          submittedAt: submission.createdAt,
        };
      })
    );

    res.json(scoreboard);

  } catch (error) {
    logger.error(`Error getting quiz results: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Get Student's Own Result
exports.getMyResult = async (req, res) => {
  const { jobId } = req.params;
  try {
    const submission = await Submission.findOne({
      job: jobId,
      student: req.user.id,
    });

    if (!submission) {
      return res.status(404).json({ message: 'You have not taken the quiz for this job yet.' });
    }

    res.json(submission);
  } catch (error) {
    logger.error(`Error getting my result: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Get a specific student's quiz result (for Recruiter/TPO)
exports.getStudentResult = async (req, res) => {
  const { jobId, studentId } = req.params;

  try {
    const submission = await Submission.findOne({
      job: jobId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).json({ message: 'This student has not taken the quiz for this job yet.' });
    }

    res.json(submission);
  } catch (error) {
    logger.error(`Error getting student result: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Get Single Submission Details (for Recruiter)
exports.getSubmissionDetails = async (req, res) => {
  const { id } = req.params; // Submission ID
  const token = req.headers.authorization;

  try {
    const submission = await Submission.findById(id).lean();
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }
    
    // --- Enrich with Application and Profile data ---
    const authAxios = createAuthAxios(token);
    let studentProfile = null;
    let application = null;

    try {
      const profileRes = await authAxios.get(`${PROFILE_SERVICE_URL}/user/${submission.student}`);
      studentProfile = profileRes.data;
    } catch (err) {
      logger.warn(`Could not fetch profile for student ${submission.student}`);
    }

    // This is the tricky part. We need to find the application ID.
    // We assume 1 student = 1 application per job.
    try {
      // We use the new endpoint in application-service
      const appRes = await authAxios.get(`${APPLICATION_SERVICE_URL}/job/${submission.job}/student/${submission.student}`);
      application = appRes.data;
    } catch (err) {
       logger.warn(`Could not fetch application for student ${submission.student} job ${submission.job}`);
    }
    
    res.json({
      submission,
      studentProfile,
      application: application // Send the whole application object
    });

  } catch (error) {
    logger.error(`Error getting submission details: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};