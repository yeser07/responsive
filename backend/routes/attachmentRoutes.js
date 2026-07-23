const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/', attachmentController.list);
router.post('/', requireMinRole('operator'), attachmentController.create);
router.get('/:id/download', attachmentController.download);

module.exports = router;
