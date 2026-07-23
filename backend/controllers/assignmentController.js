const { ConfigurationItem } = require('../models/configurationItem');
const Assignment = require('../models/assignment');
const UserOwner = require('../models/userOwner');
const Letter = require('../models/letter');
const { parsePagination, parseSort } = require('../utils/pagination');
const { recordAudit } = require('../utils/audit');
const { enqueueLetter } = require('../utils/pdfQueue');

const ASSIGNMENT_SORT_FIELDS = ['assignmentDate', 'status', 'returnDate', 'createdAt'];

exports.getAllAssignments = async (req, res) => {
  try {
    const { page, rowsPerPage, skip, limit } = parsePagination(req.query);
    const sortObject = parseSort(req.query, ASSIGNMENT_SORT_FIELDS, 'assignmentDate');
    const search = String(req.query.search || '').trim();
    const status = req.query.status ? String(req.query.status) : '';

    const filter = {};
    if (status) filter.status = status;

    let assignmentsQuery = Assignment.find(filter)
      .populate('userOwnerId', 'name logonUser jobDescription')
      .populate('configurationItemId', 'className serialNumber brandName modelName status')
      .sort(Object.keys(sortObject).length ? sortObject : { assignmentDate: -1 });

    const allForFilter = await assignmentsQuery.lean();
    let filtered = allForFilter;
    if (search) {
      const term = search.toLowerCase();
      filtered = allForFilter.filter((item) => {
        const values = [
          item.userOwnerId?.name,
          item.userOwnerId?.logonUser,
          item.configurationItemId?.brandName,
          item.configurationItemId?.modelName,
          item.configurationItemId?.serialNumber,
          item.status,
        ];
        return values.some((v) => String(v || '').toLowerCase().includes(term));
      });
    }

    const total = filtered.length;
    const pageItems = filtered.slice(skip, skip + limit);
    const assignmentIds = pageItems.map((a) => a._id);
    const letters = await Letter.find({ assignmentId: { $in: assignmentIds } })
      .select('assignmentId _id')
      .lean();
    const letterByAssignment = new Map(letters.map((l) => [String(l.assignmentId), l._id]));

    const items = pageItems.map((assignment) => ({
      ...assignment,
      hasLetter: letterByAssignment.has(String(assignment._id)),
      letterId: letterByAssignment.get(String(assignment._id)) || null,
    }));

    res.status(200).json({ items, total, page, rowsPerPage });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: status === 400 ? error.message : 'Internal server error',
      error: error.message,
    });
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
  const {
    userOwnerId,
    configurationItemId,
    accessories = [],
    generateLetter = false,
    signatureDataUrl,
  } = req.body;

  try {
    const user = await UserOwner.findById(userOwnerId);
    if (!user || user.status !== 'active' || user.deletedAt) {
      return res.status(400).json({ message: 'Active User Owner is required' });
    }

    const ci = await ConfigurationItem.findById(configurationItemId);
    if (!ci || ci.deletedAt) {
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
      letter = await enqueueLetter(assignment._id, signatureDataUrl);
    }

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'create',
      entityType: 'assignment',
      entityId: assignment._id,
      meta: { generateLetter: Boolean(generateLetter) },
    });

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

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'return',
      entityType: 'assignment',
      entityId: assignment._id,
    });

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
    const letter = await enqueueLetter(req.params.id, signatureDataUrl);
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'generate_letter',
      entityType: 'assignment',
      entityId: req.params.id,
    });
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
