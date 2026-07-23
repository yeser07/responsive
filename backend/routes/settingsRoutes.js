const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireRole } = require('../middlewares/requireRole');

router.get('/letter-template', settingsController.getLetterTemplate);
router.put('/letter-template', requireRole('admin'), settingsController.updateLetterTemplate);

module.exports = router;
