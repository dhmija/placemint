const express = require('express');

module.exports = (skillsController) => {
  const router = express.Router();

  router.get('/', skillsController.getSkills);

  return router;
};
