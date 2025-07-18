const express = require('express');
const router = express.Router();

const UserOwnerController = require('../controllers/UserOwnerController');
const validateUserOwnerFields = require('../middlewares/validateUserOwnerFields');

router.get('/', UserOwnerController.getAllUsers);
router.get('/:id', UserOwnerController.getUserById);

router.put('/:id', UserOwnerController.updateUser);
router.put('/:id/status', UserOwnerController.toggleUserStatus);
router.post('/', validateUserOwnerFields, UserOwnerController.createUser);
router.post('/:id', validateUserOwnerFields, UserOwnerController.updateUser);

module.exports = router;
