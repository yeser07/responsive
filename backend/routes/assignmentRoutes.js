const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const validateAssignmentFields = require('../middlewares/validateAssignmentFields');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/', assignmentController.getAllAssignments);
router.get('/user/:id', assignmentController.getAssignmentByUserOwnerId);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', requireMinRole('operator'), validateAssignmentFields, assignmentController.createAssignment);
router.put('/:id/return', requireMinRole('operator'), assignmentController.returnAssignment);
router.post('/:id/letter', requireMinRole('operator'), assignmentController.generateLetterForAssignment);

module.exports = router;
