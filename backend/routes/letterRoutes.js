const express = require('express');
const router = express.Router();
const letterController = require('../controllers/letterController');

router.get('/', letterController.getAllLetters);
router.get('/:id/download', letterController.downloadLetter);
router.get('/:id', letterController.getLetterById);

module.exports = router;
