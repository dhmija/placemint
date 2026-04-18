const express = require('express');

module.exports = (quizController, { protect, checkRole }) => {
  const router = express.Router();

  router.post('/', protect, checkRole(['placementcell']), quizController.createQuiz);
  router.get('/job/:jobId', protect, quizController.getQuizForJob);
  router.post('/job/:jobId/submit', protect, checkRole(['student']), quizController.submitQuiz);
  router.get('/job/:jobId/results', protect, checkRole(['placementcell']), quizController.getQuizResults);
  router.get('/job/:jobId/myresult', protect, quizController.getMyResult);
  router.get('/job/:jobId/student/:studentId/result', protect, checkRole(['placementcell']), quizController.getStudentResult);
  router.get('/submission/:submissionId', protect, quizController.getSubmissionDetails);

  return router;
};
