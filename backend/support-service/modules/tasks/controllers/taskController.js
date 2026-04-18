const axios = require('axios');

module.exports = (Task, TaskSubmission, logger) => {
  const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST;
  const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;

  return {
    createTask: async (req, res) => {
      const { job, title, description, languageId, starterCode, testCases } = req.body;

      try {
        let task = await Task.findOne({ job: job });

        if (task) {
          task.title = title;
          task.description = description;
          task.languageId = languageId;
          task.starterCode = starterCode;
          task.testCases = testCases;
          await task.save();
          logger.info(`Task updated for job ${job} by user ${req.user.id}`);
          res.status(200).json(task);
        } else {
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
    },

    getTaskForJob: async (req, res) => {
      const { jobId } = req.params;
      try {
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

        res.json({
          _id: task._id,
          job: task.job,
          title: task.title,
          description: task.description,
          languageId: task.languageId,
          starterCode: task.starterCode,
          testCases: task.testCases.filter(tc => !tc.hidden),
        });
      } catch (error) {
        logger.error(`Error getting task: ${error.message}`, { userId: req.user.id, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    submitTask: async (req, res) => {
      const { jobId } = req.params;
      const { code } = req.body;
      const studentId = req.user.id;

      try {
        const task = await Task.findOne({ job: jobId });
        if (!task) {
          return res.status(404).json({ message: 'Task not found.' });
        }

        const existingSubmission = await TaskSubmission.findOne({
          task: task._id,
          student: studentId,
        });
        if (existingSubmission) {
          return res.status(403).json({ message: 'You have already submitted this task.' });
        }

        const submission = new TaskSubmission({
          task: task._id,
          job: jobId,
          student: studentId,
          code,
          status: 'Pending',
          results: [],
        });

        const submissions = task.testCases.map(tc => ({
          language_id: task.languageId,
          source_code: Buffer.from(code).toString('base64'),
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

        const postResponse = await axios.request(options);
        const tokens = postResponse.data.map(s => s.token).join(',');

        let resultsData;
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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

          if (statuses.every(s => s > 2)) {
            resultsData = getResponse.data.submissions;
            break;
          }
        }

        let allPassed = true;
        const results = resultsData.map((result, index) => {
          const tc = task.testCases[index];
          const passed = result.status.id === 3;
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
    },

    getTaskResults: async (req, res) => {
      const { jobId } = req.params;
      try {
        const submissions = await TaskSubmission.find({ job: jobId })
          .select('student status createdAt')
          .sort({ status: 1, createdAt: 1 });

        res.json(submissions);
      } catch (error) {
        logger.error(`Error getting task results: ${error.message}`, { userId: req.user.id, stack: error.stack });
        res.status(500).json({ message: 'Server error' });
      }
    },

    getMyResult: async (req, res) => {
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
    },

    getStudentResult: async (req, res) => {
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
    },
  };
};
