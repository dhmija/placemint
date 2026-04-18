const express = require('express');

module.exports = (profileController, { protect, checkRole }, uploadResume) => {
  const router = express.Router();

  router.get('/me', protect, profileController.getMyProfile);
  router.get('/search', protect, profileController.searchProfiles);
  router.post('/', protect, uploadResume, profileController.createOrUpdateProfile);
  router.get('/all', protect, checkRole(['placementcell']), profileController.getAllProfiles);
  router.get('/user/:userId', protect, profileController.getProfileByUserId);

  return router;
};
