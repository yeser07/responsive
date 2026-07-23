const path = require('path');
const fs = require('fs');
const Letter = require('../models/letter');

exports.getAllLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate({
        path: 'assignmentId',
        populate: [
          { path: 'userOwnerId', select: 'name logonUser' },
          { path: 'configurationItemId', select: 'serialNumber brandName modelName' },
        ],
      })
      .sort({ creationDate: -1 });
    res.status(200).json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getLetterById = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id).populate('assignmentId');
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    res.status(200).json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.downloadLetter = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    if (!fs.existsSync(letter.filePath)) {
      return res.status(404).json({ message: 'PDF file not found on disk' });
    }
    res.download(letter.filePath, letter.fileName || path.basename(letter.filePath));
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
