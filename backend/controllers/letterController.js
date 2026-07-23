const path = require('path');
const fs = require('fs');
const Letter = require('../models/letter');
const { parsePagination } = require('../utils/pagination');

exports.getAllLetters = async (req, res) => {
  try {
    const { page, rowsPerPage, skip, limit } = parsePagination(req.query);
    const search = String(req.query.search || '').trim();

    const letters = await Letter.find()
      .populate({
        path: 'assignmentId',
        populate: [
          { path: 'userOwnerId', select: 'name logonUser' },
          { path: 'configurationItemId', select: 'serialNumber brandName modelName' },
        ],
      })
      .sort({ creationDate: -1 })
      .lean();

    let filtered = letters;
    if (search) {
      const term = search.toLowerCase();
      filtered = letters.filter((letter) => {
        const values = [
          letter.fileName,
          letter.assignmentId?.userOwnerId?.name,
          letter.assignmentId?.userOwnerId?.logonUser,
          letter.assignmentId?.configurationItemId?.serialNumber,
          letter.assignmentId?.configurationItemId?.brandName,
        ];
        return values.some((v) => String(v || '').toLowerCase().includes(term));
      });
    }

    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit);
    res.status(200).json({ items, total, page, rowsPerPage });
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
