const axios = require('axios');

module.exports = (Quiz, Submission, logger) => {
  const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
  const APPLICATION_SERVICE_URL = process.env.APPLICATION_SERVICE_URL || 'http://application-service:5004';

  return {
    createQuiz: async (req, res) => {
      try {
        const { job, questions, duration } = req.body;

        if (!job) {
          return res.status(400).json({ message: 'Job ID is required' });
        }

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
          return res.status(400).json({ message: 'Questions are required' });
        }

        const existingQuiz = await Quiz.findOne({ job });
        if (existingQuiz) {
          return res.status(400).json({ message: 'Quiz already exists for this job' });
        }

        const quiz = new Quiz({
          job,
          questions,
          duration: duration || 60,
        });

        await quiz.save();
        logger.info(`Quiz created for job ${job}`);
        res.status(201).json(quiz);
      } catch (error) {
        logger.error(`Error in createQuiz: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getQuizForJob: async (req, res) => {
      try {
        const { jobId } = req.params;
        const quiz = await Quiz.findOne({ job: jobId });

        if (!quiz) {
          return res.status(404).json({ message: 'Quiz not found for this job' });
        }

        const quizToReturn = quiz.toObject();
        delete quizToReturn.questions;
        quizToReturn.questionCount = quiz.questions.length;

        logger.info(`Quiz retrieved for job ${jobId}`);
        res.json(quizToReturn);
      } catch (error) {
        logger.error(`Error in getQuizForJob: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    submitQuiz: async (req, res) => {
      try {
        const { jobId } = req.params;
        const { answers } = req.body;
        const studentId = req.user.id;

        if (!answers || !Array.isArray(answers)) {
          return res.status(400).json({ message: 'Answers are required' });
        }

        const quiz = await Quiz.findOne({ job: jobId }).select('+questions.correctAnswer');

        if (!quiz) {
          return res.status(404).json({ message: 'Quiz not found' });
        }

        const totalQuestions = quiz.questions.length;
        if (answers.length !== totalQuestions) {
          return res.status(400).json({ message: `Expected ${totalQuestions} answers, got ${answers.length}` });
        }

        let score = 0;
        answers.forEach((answer, index) => {
          if (answer === quiz.questions[index].correctAnswer) {
            score++;
          }
        });

        const percentage = Math.round((score / totalQuestions) * 100);

        const existingSubmission = await Submission.findOne({
          quiz: quiz._id,
          student: studentId,
        });

        if (existingSubmission) {
          return res.status(400).json({ message: 'You have already submitted this quiz' });
        }

        const submission = new Submission({
          quiz: quiz._id,
          student: studentId,
          answers,
          score,
          totalQuestions,
          percentage,
        });

        await submission.save();
        logger.info(`Quiz submitted by student ${studentId} for job ${jobId}`);
        res.json({ message: 'Quiz submitted successfully', score, percentage });
      } catch (error) {
        logger.error(`Error in submitQuiz: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getQuizResults: async (req, res) => {
      try {
        const { jobId } = req.params;

        const quiz = await Quiz.findOne({ job: jobId });

        if (!quiz) {
          return res.status(404).json({ message: 'Quiz not found' });
        }

        const submissions = await Submission.find({ quiz: quiz._id });

        const enrichedSubmissions = await Promise.all(
          submissions.map(async (submission) => {
            try {
              const profileRes = await axios.get(`${AUTH_SERVICE_URL}/profile/user/${submission.student}`);
              return {
                ...submission.toObject(),
                studentName: profileRes.data.name,
                enrollmentNumber: profileRes.data.enrollmentNumber,
              };
            } catch (err) {
              logger.warn(`Could not fetch profile for student ${submission.student}`);
              return submission.toObject();
            }
          })
        );

        logger.info(`Quiz results retrieved for job ${jobId}`);
        res.json(enrichedSubmissions);
      } catch (error) {
        logger.error(`Error in getQuizResults: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getMyResult: async (req, res) => {
      try {
        const { jobId } = req.params;
        const studentId = req.user.id;

        const quiz = await Quiz.findOne({ job: jobId });

        if (!quiz) {
          return res.status(404).json({ message: 'Quiz not found' });
        }

        const submission = await Submission.findOne({
          quiz: quiz._id,
          student: studentId,
        });

        if (!submission) {
          return res.status(404).json({ message: 'No submission found for this quiz' });
        }

        logger.info(`Student ${studentId} retrieved their result for job ${jobId}`);
        res.json(submission);
      } catch (error) {
        logger.error(`Error in getMyResult: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getStudentResult: async (req, res) => {
      try {
        const { jobId, studentId } = req.params;

        const quiz = await Quiz.findOne({ job: jobId });

        if (!quiz) {
          return res.status(404).json({ message: 'Quiz not found' });
        }

        const submission = await Submission.findOne({
          quiz: quiz._id,
          student: studentId,
        });

        if (!submission) {
          return res.status(404).json({ message: 'No submission found for this student' });
        }

        logger.info(`Result retrieved for student ${studentId} in job ${jobId}`);
        res.json(submission);
      } catch (error) {
        logger.error(`Error in getStudentResult: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getSubmissionDetails: async (req, res) => {
      try {
        const { submissionId } = req.params;
        const studentId = req.user.id;

        const submission = await Submission.findById(submissionId);

        if (!submission) {
          return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.student.toString() !== studentId) {
          logger.warn(`Unauthorized access attempt to submission ${submissionId} by ${studentId}`);
          return res.status(403).json({ message: 'You do not have permission to view this submission' });
        }

        const quiz = await Quiz.findById(submission.quiz);

        const detailsToReturn = {
          ...submission.toObject(),
          questions: quiz.questions.map((q, idx) => ({
            text: q.questionText,
            options: q.options,
            studentAnswer: submission.answers[idx],
            isCorrect: submission.answers[idx] === q.correctAnswer,
          })),
        };

        delete detailsToReturn.answers;

        logger.info(`Submission details retrieved for ${studentId}`);
        res.json(detailsToReturn);
      } catch (error) {
        logger.error(`Error in getSubmissionDetails: ${error.message}`, { stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },
  };
};
