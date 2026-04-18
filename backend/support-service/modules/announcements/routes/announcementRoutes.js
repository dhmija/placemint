const express = require('express');

module.exports = (announcementController, { protect, checkRole }) => {
  const router = express.Router();

  router.get('/', protect, announcementController.getAllAnnouncements);
  router.post('/', protect, checkRole(['placementcell']), announcementController.createAnnouncement);
  router.put('/:id', protect, checkRole(['placementcell']), announcementController.updateAnnouncement);
  router.delete('/:id', protect, checkRole(['placementcell']), announcementController.deleteAnnouncement);

  return router;
};
