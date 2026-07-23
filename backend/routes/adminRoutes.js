const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.list);
router.post('/', adminController.create);
router.delete('/:id', adminController.remove);

module.exports = router;
