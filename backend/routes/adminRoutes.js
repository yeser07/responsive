const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middlewares/requireRole');

router.use(requireRole('admin'));
router.get('/', adminController.list);
router.post('/', adminController.create);
router.put('/:id/role', adminController.updateRole);
router.delete('/:id', adminController.remove);

module.exports = router;
