const express = require('express');

module.exports = (taskController, { protect, checkRole }) => {
  const router = express.Router();

  router.post('/', protect, checkRole(['recruiter', 'placementcell']), taskController.createTask);
  router.get('/job/:jobId', protect, taskController.getTaskForJob);
  router.post('/job/:jobId/submit', protect, taskController.submitTask);
  router.get('/job/:jobId/results', protect, taskController.getTaskResults);
  router.get('/job/:jobId/my-result', protect, taskController.getMyResult);
  router.get('/job/:jobId/student/:studentId', protect, taskController.getStudentResult);

  return router;
};
