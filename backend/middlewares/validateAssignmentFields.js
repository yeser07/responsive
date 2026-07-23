const { body, validationResult } = require('express-validator');

const validateAssignmentFields = [
  body('userOwnerId').notEmpty().withMessage('User Owner is required'),
  body('configurationItemId').notEmpty().withMessage('Configuration Item is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validateAssignmentFields;
