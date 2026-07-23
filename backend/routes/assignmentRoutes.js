const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const validateAssignmentFields = require('../middlewares/validateAssignmentFields');

router.get('/', assignmentController.getAllAssignments);
router.get('/user/:id', assignmentController.getAssignmentByUserOwnerId);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', validateAssignmentFields, assignmentController.createAssignment);
router.put('/:id/return', assignmentController.returnAssignment);
router.post('/:id/letter', assignmentController.generateLetterForAssignment);

module.exports = router;
