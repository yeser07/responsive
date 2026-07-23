const express = require('express');
const router = express.Router();
const configurationItemController = require('../controllers/configurationItemController');
const validateConfigurationItemFields = require('../middlewares/validateConfigurationItemFields');
const { requireMinRole } = require('../middlewares/requireRole');

router.get('/', configurationItemController.getAllConfigurationItems);
router.post('/import', requireMinRole('operator'), configurationItemController.importConfigurationItems);
router.get('/:id', configurationItemController.getConfigurationItemById);
router.put('/:id/status', requireMinRole('operator'), configurationItemController.toggleConfigurationItemStatus);
router.put('/:id/:status', requireMinRole('operator'), configurationItemController.toggleConfigurationItemStatus);
router.post('/:id/restore', requireMinRole('admin'), configurationItemController.restoreConfigurationItem);
router.delete('/:id', requireMinRole('admin'), configurationItemController.softDeleteConfigurationItem);
router.post('/', requireMinRole('operator'), validateConfigurationItemFields, configurationItemController.createConfigurationItem);
router.post('/:id', requireMinRole('operator'), validateConfigurationItemFields, configurationItemController.updateConfigurationItem);

module.exports = router;
