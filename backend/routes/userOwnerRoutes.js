const express = require('express');
const router = express.Router();

const UserOwnerController = require('../controllers/UserOwnerController');
const validateUserOwnerFields = require('../middlewares/validateUserOwnerFields');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/', UserOwnerController.getAllUsers);
router.post('/import', requireMinRole('operator'), UserOwnerController.importUserOwners);
router.get('/:id', UserOwnerController.getUserById);
router.put('/:id', requireMinRole('operator'), validateUserOwnerFields, UserOwnerController.updateUser);
router.put('/:id/status', requireMinRole('operator'), UserOwnerController.toggleUserStatus);
router.post('/:id/restore', requireMinRole('admin'), UserOwnerController.restoreUser);
router.delete('/:id', requireMinRole('admin'), UserOwnerController.softDeleteUser);
router.post('/', requireMinRole('operator'), validateUserOwnerFields, UserOwnerController.createUser);
router.post('/:id', requireMinRole('operator'), validateUserOwnerFields, UserOwnerController.updateUser);

module.exports = router;
