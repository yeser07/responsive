const { ConfigurationItem } = require('../models/configurationItem');
const Assignment = require('../models/assignment');
const UserOwner = require('../models/userOwner');
const Letter = require('../models/letter');
const { createAssignmentLetter } = require('../services/letterService');

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('userOwnerId', 'name logonUser jobDescription')
      .populate('configurationItemId', 'className serialNumber brandName modelName status')
      .sort({ assignmentDate: -1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);
    const letters = await Letter.find({ assignmentId: { $in: assignmentIds } }).select('assignmentId _id').lean();
    const letterByAssignment = new Map(letters.map((l) => [String(l.assignmentId), l._id]));

    const items = assignments.map((assignment) => ({
      ...assignment,
      hasLetter: letterByAssignment.has(String(assignment._id)),
      letterId: letterByAssignment.get(String(assignment._id)) || null,
    }));

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAssignmentByUserOwnerId = async (req, res) => {
  try {
    const assignments = await Assignment.find({ userOwnerId: req.params.id })
      .populate('configurationItemId', 'className serialNumber brandName modelName status')
      .sort({ assignmentDate: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('userOwnerId', 'name logonUser jobDescription')
      .populate('configurationItemId', 'className serialNumber brandName modelName location status');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.createAssignment = async (req, res) => {
  const { userOwnerId, configurationItemId, accessories = [], generateLetter = false, signatureDataUrl } = req.body;

  try {
    const user = await UserOwner.findById(userOwnerId);
    if (!user || user.status !== 'active') {
      return res.status(400).json({ message: 'Active User Owner is required' });
    }

    const ci = await ConfigurationItem.findById(configurationItemId);
    if (!ci) {
      return res.status(404).json({ message: 'Configuration item not found' });
    }
    if (ci.status !== 'stock') {
      return res.status(400).json({ message: 'Configuration item must be in stock to assign' });
    }

    const activeAssignment = await Assignment.findOne({
      configurationItemId,
      status: 'assigned',
    });
    if (activeAssignment) {
      return res.status(400).json({ message: 'Configuration item already has an active assignment' });
    }

    const assignment = await Assignment.create({
      userOwnerId,
      configurationItemId,
      accessories: Array.isArray(accessories) ? accessories : [],
      status: 'assigned',
    });

    ci.status = 'In use';
    await ci.save();

    let letter = null;
    if (generateLetter) {
      letter = await createAssignmentLetter(assignment._id, signatureDataUrl);
    }

    const populated = await Assignment.findById(assignment._id)
      .populate('userOwnerId', 'name logonUser jobDescription')
      .populate('configurationItemId', 'className serialNumber brandName modelName status');

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: populated,
      letter,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.returnAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    if (assignment.status === 'returned') {
      return res.status(400).json({ message: 'Assignment already returned' });
    }

    assignment.status = 'returned';
    assignment.returnDate = req.body?.returnDate ? new Date(req.body.returnDate) : new Date();
    await assignment.save();

    await ConfigurationItem.findByIdAndUpdate(assignment.configurationItemId, { status: 'stock' });

    const populated = await Assignment.findById(assignment._id)
      .populate('userOwnerId', 'name logonUser')
      .populate('configurationItemId', 'className serialNumber brandName modelName status');

    res.status(200).json({
      message: 'Assignment returned successfully',
      assignment: populated,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.generateLetterForAssignment = async (req, res) => {
  try {
    const signatureDataUrl = req.body?.signatureDataUrl;
    const letter = await createAssignmentLetter(req.params.id, signatureDataUrl);
    res.status(201).json({
      message: 'Letter generated successfully',
      letter,
    });
  } catch (error) {
    if (error.code === 'LETTER_EXISTS') {
      return res.status(409).json({
        message: 'Ya existe una carta para esta asignación',
        letter: error.letter,
      });
    }
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};
