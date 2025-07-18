
const { body, validationResult } = require('express-validator');

const validateUserOwnerFields = [
  body('name').notEmpty().withMessage('Name is required'),
  body('logonUser').notEmpty().withMessage('Logon User is required'),
  body('jobDescription').notEmpty().withMessage('Job Description is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = validateUserOwnerFields;
