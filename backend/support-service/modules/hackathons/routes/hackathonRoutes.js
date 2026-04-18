const express = require('express');

module.exports = (hackathonController, { protect, checkRole }) => {
  const router = express.Router();

  router.get('/', protect, hackathonController.getAllHackathons);
  router.get('/active', protect, hackathonController.getActiveHackathons);
  router.get('/:id', protect, hackathonController.getHackathonById);
  router.post('/', protect, checkRole(['placementcell']), hackathonController.createHackathon);
  router.put('/:id', protect, checkRole(['placementcell']), hackathonController.updateHackathon);
  router.delete('/:id', protect, checkRole(['placementcell']), hackathonController.deleteHackathon);

  return router;
};
