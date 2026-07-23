const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/dashboard', reportsController.dashboard);
router.get('/notifications', reportsController.notifications);

module.exports = router;
