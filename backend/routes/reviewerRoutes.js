const express = require('express');
const router = express.Router();

const ReviewerController = require('../controllers/reviewerController');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/', ReviewerController.getAllReviewers);
router.get('/:id', ReviewerController.getReviewerById);
router.post('/', requireMinRole('operator'), ReviewerController.createReviewer);
router.put('/:id', requireMinRole('operator'), ReviewerController.updateReviewer);
router.put('/:id/status', requireMinRole('operator'), ReviewerController.toggleReviewerStatus);
router.delete('/:id', requireMinRole('admin'), ReviewerController.softDeleteReviewer);

module.exports = router;
