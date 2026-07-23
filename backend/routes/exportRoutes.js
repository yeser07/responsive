const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/users', requireMinRole('operator'), exportController.exportUsers);
router.get('/cis', requireMinRole('operator'), exportController.exportCis);
router.get('/assignments', requireMinRole('operator'), exportController.exportAssignments);

module.exports = router;
