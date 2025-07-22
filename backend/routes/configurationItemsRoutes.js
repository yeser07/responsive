const express = require('express');
const router = express.Router();
const configurationItemController = require('../controllers/configurationItemController');
const validateConfigurationItemFields = require('../middlewares/validateConfigurationItemFields');

router.get('/', configurationItemController.getAllConfigurationItems);
router.get('/:id', configurationItemController.getConfigurationItemById);

router.put('/:id/status', configurationItemController.toggleConfigurationItemStatus);
router.post('/', validateConfigurationItemFields, configurationItemController.createConfigurationItem);
router.post('/:id', validateConfigurationItemFields, configurationItemController.updateConfigurationItem);

module.exports = router;
