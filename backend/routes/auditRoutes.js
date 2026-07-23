const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/', requireMinRole('operator'), auditController.list);

module.exports = router;
