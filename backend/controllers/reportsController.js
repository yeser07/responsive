const UserOwner = require('../models/userOwner');
const { ConfigurationItem } = require('../models/configurationItem');
const Assignment = require('../models/assignment');
const Letter = require('../models/letter');
const AuditLog = require('../models/auditLog');
const { getQueueStats } = require('../utils/pdfQueue');

exports.dashboard = async (req, res) => {
  try {
    const notDeleted = { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
    const [
      usersActive,
      usersTotal,
      cisTotal,
      cisByStatus,
      assignmentsOpen,
      lettersTotal,
      recentAudit,
    ] = await Promise.all([
      UserOwner.countDocuments({ ...notDeleted, status: 'active' }),
      UserOwner.countDocuments(notDeleted),
      ConfigurationItem.countDocuments(notDeleted),
      ConfigurationItem.aggregate([
        { $match: notDeleted },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Assignment.countDocuments({ status: 'assigned' }),
      Letter.countDocuments(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const statusMap = Object.fromEntries(cisByStatus.map((row) => [row._id, row.count]));

    res.status(200).json({
      users: { active: usersActive, total: usersTotal },
      cis: {
        total: cisTotal,
        byStatus: statusMap,
        stock: statusMap.stock || 0,
        inUse: statusMap['In use'] || 0,
        missing: statusMap.missing || 0,
        damaged: statusMap.damaged || 0,
      },
      assignmentsOpen,
      lettersTotal,
      pdfQueue: getQueueStats(),
      recentAudit,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.notifications = async (req, res) => {
  try {
    const days = Math.max(1, parseInt(req.query.days, 10) || 30);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [staleAssignments, problemCis] = await Promise.all([
      Assignment.find({ status: 'assigned', assignmentDate: { $lte: cutoff } })
        .populate('userOwnerId', 'name logonUser')
        .populate('configurationItemId', 'serialNumber brandName modelName')
        .sort({ assignmentDate: 1 })
        .limit(50)
        .lean(),
      ConfigurationItem.find({
        status: { $in: ['missing', 'damaged'] },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
        .limit(50)
        .lean(),
    ]);

    res.status(200).json({
      days,
      staleAssignments,
      problemCis,
      counts: {
        staleAssignments: staleAssignments.length,
        problemCis: problemCis.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
