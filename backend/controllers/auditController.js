const AuditLog = require('../models/auditLog');
const { parsePagination } = require('../utils/pagination');

exports.list = async (req, res) => {
  try {
    const { page, rowsPerPage, skip, limit } = parsePagination(req.query);
    const entityType = req.query.entityType ? String(req.query.entityType) : '';
    const filter = {};
    if (entityType) filter.entityType = entityType;

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({ items, total, page, rowsPerPage });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
