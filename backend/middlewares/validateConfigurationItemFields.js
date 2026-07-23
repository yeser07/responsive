const {body, validationResult} = require('express-validator');

const validateConfigurationItemFields = [
    body('className').notEmpty().withMessage('Class Name is required'),
    body('serialNumber').notEmpty().withMessage('Serial Number is required'),
    body('brandName').notEmpty().withMessage('Brand Name is required'),
    body('modelName').notEmpty().withMessage('Model Name is required'),
    body('location').notEmpty().withMessage('Location is required'),
 
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }
        next();
    }
];

module.exports = validateConfigurationItemFields;   
