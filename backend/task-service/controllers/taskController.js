const Task = require('../models/taskModel');
const TaskSubmission = require('../models/taskSubmissionModel');
const logger = require('../config/logger');
const axios = require('axios');

const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST;
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

// 1. Create Task
exports.createTask = async (req, res) => {
  const { job, title, description, languageId, starterCode, testCases } = req.body;

  try {
    // Check if a task for this job already exists
    let task = await Task.findOne({ job: job });

    if (task) {
      // Update existing task
      task.title = title;
      task.description = description;
      task.languageId = languageId;
      task.starterCode = starterCode;
      task.testCases = testCases;
      await task.save();
      logger.info(`Task updated for job ${job} by user ${req.user.id}`);
      res.status(200).json(task);
    } else {
      // Create new task
      task = new Task({
        job,
        title,
        description,
        languageId,
        starterCode,
        testCases,
      });
      await task.save();
      logger.info(`New task created for job ${job} by user ${req.user.id}`);
      res.status(201).json(task);
    }
  } catch (error) {
    logger.error(`Error creating/updating task: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get Task For Job (for Student)
exports.getTaskForJob = async (req, res) => {
  const { jobId } = req.params;
  try {
    // Check if student already submitted
    const existingSubmission = await TaskSubmission.findOne({
      job: jobId,
      student: req.user.id,
    });
    if (existingSubmission) {
      return res.status(403).json({ message: 'You have already submitted this task.' });
    }

    const task = await Task.findOne({ job: jobId });
    if (!task) {
      return res.status(404).json({ message: 'No task found for this job.' });
    }
    
    // Send a "clean" version of the task (without hidden test case details)
    res.json({
      _id: task._id,
      job: task.job,
      title: task.title,
      description: task.description,
      languageId: task.languageId,
      starterCode: task.starterCode,
      // Send only public test cases
      testCases: task.testCases.filter(tc => !tc.hidden)
    });

  } catch (error) {
    logger.error(`Error getting task: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Submit Task (The core Judge0 logic)
exports.submitTask = async (req, res) => {
  const { jobId } = req.params;
  const { code } = req.body; // Student's code
  const studentId = req.user.id;

  try {
    // Get the task with all test cases
    const task = await Task.findOne({ job: jobId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }
    
    // Check for existing submission
    const existingSubmission = await TaskSubmission.findOne({
      task: task._id,
      student: studentId,
    });
    if (existingSubmission) {
      return res.status(403).json({ message: 'You have already submitted this task.' });
    }

    // Create a submission in "Pending" state
    const submission = new TaskSubmission({
      task: task._id,
      job: jobId,
      student: studentId,
      code,
      status: 'Pending',
      results: [],
    });

    // --- Judge0 Logic ---
    // We send all test cases at once in a batch
    const submissions = task.testCases.map(tc => ({
      language_id: task.languageId,
      source_code: Buffer.from(code).toString('base64'), // Base64 encode the code
      stdin: Buffer.from(tc.input).toString('base64'),
      expected_output: Buffer.from(tc.expectedOutput).toString('base64'),
    }));

    const options = {
      method: 'POST',
      url: `https://${JUDGE0_API_HOST}/submissions/batch`,
      params: { base64_encoded: 'true' },
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': JUDGE0_API_HOST,
      },
      data: { submissions },
    };

    // 1. Post batch submission to Judge0
    const postResponse = await axios.request(options);
    const tokens = postResponse.data.map(s => s.token).join(',');

    // 2. Poll Judge0 for results
    let resultsData;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      const getOptions = {
        method: 'GET',
        url: `https://${JUDGE0_API_HOST}/submissions/batch`,
        params: {
          tokens: tokens,
          base64_encoded: 'true',
          fields: 'status,stdout,stderr,expected_output,stdin',
        },
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': JUDGE0_API_HOST,
        },
      };
      const getResponse = await axios.request(getOptions);
      const statuses = getResponse.data.submissions.map(s => s.status.id);
      
      // If all are finished (ID > 2), break the loop
      if (statuses.every(s => s > 2)) {
        resultsData = getResponse.data.submissions;
        break;
      }
    }

    // 3. Grade the submission
    let allPassed = true;
    const results = resultsData.map((result, index) => {
      const tc = task.testCases[index];
      const passed = result.status.id === 3; // 3 = "Accepted"
      if (!passed) allPassed = false;

      return {
        input: Buffer.from(result.stdin, 'base64').toString('utf-8'),
        expectedOutput: Buffer.from(result.expected_output, 'base64').toString('utf-8'),
        actualOutput: Buffer.from(result.stdout || '', 'base64').toString('utf-8'),
        passed: passed,
        status: result.status.description,
      };
    });
    
    submission.results = results;
    submission.status = allPassed ? 'Passed' : 'Failed';
    await submission.save();

    logger.info(`New task submission for job ${jobId} by student ${studentId}. Status: ${submission.status}`);
    res.status(201).json(submission);

  } catch (error) {
    logger.error(`Error submitting task: ${error.message}`, { userId: req.user.id, stack: error.stack });
    if (error.response) {
      logger.error('Judge0 API Error:', error.response.data);
    }
    res.status(500).json({ message: 'Server error during task submission.' });
  }
};

// 4. Get Task Results (Scoreboard for Recruiter/TPO)
exports.getTaskResults = async (req, res) => {
  const { jobId } = req.params;
  try {
    const submissions = await TaskSubmission.find({ job: jobId })
      .select('student status createdAt') // Only get what's needed for scoreboard
      .sort({ status: 1, createdAt: 1 }); // 'Passed' first, then fastest

    // We'd enrich this with profile data just like the quiz service,
    // but for now, we'll send the raw results.
    // (This is a good spot for a frontend enhancement)
    
    res.json(submissions);

  } catch (error) {
    logger.error(`Error getting task results: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Get Student's Own Result for a Task
exports.getMyResult = async (req, res) => {
  const { jobId } = req.params;
  try {
    const submission = await TaskSubmission.findOne({
      job: jobId,
      student: req.user.id,
    });

    if (!submission) {
      return res.status(404).json({ message: 'You have not submitted a solution for this task yet.' });
    }
    res.json(submission);
  } catch (error) {
    logger.error(`Error getting my result: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Get a specific student's task result (for Recruiter/TPO)
exports.getStudentResult = async (req, res) => {
  const { jobId, studentId } = req.params;
  try {
    const submission = await TaskSubmission.findOne({
      job: jobId,
      student: studentId,
    });

    if (!submission) {
      return res.status(404).json({ message: 'This student has not submitted a solution for this task yet.' });
    }
    res.json(submission);
  } catch (error) {
    logger.error(`Error getting student result: ${error.message}`, { userId: req.user.id, stack: error.stack });
    res.status(500).json({ message: 'Server error' });
  }
};