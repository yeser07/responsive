const { ConfigurationItem } = require('../models/configurationItem');
const { parsePagination, parseSort } = require('../utils/pagination');
const { recordAudit } = require('../utils/audit');

const CI_SORT_FIELDS = [
  'className',
  'serialNumber',
  'brandName',
  'modelName',
  'location',
  'status',
  'createdAt',
];

function notDeleted() {
  return { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
}

exports.createConfigurationItem = async (req, res) => {
  try {
    const newItem = new ConfigurationItem(req.body);
    await newItem.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'create',
      entityType: 'configurationItem',
      entityId: newItem._id,
    });
    res.status(201).json({
      message: 'Configuration item created successfully',
      item: newItem,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateConfigurationItem = async (req, res) => {
  try {
    const updatedItem = await ConfigurationItem.findOneAndUpdate(
      { _id: req.params.id, ...notDeleted() },
      req.body,
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Configuration item not found' });
    }
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'update',
      entityType: 'configurationItem',
      entityId: updatedItem._id,
    });
    res.status(200).json({
      message: 'Configuration item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getConfigurationItemById = async (req, res) => {
  try {
    const item = await ConfigurationItem.findOne({ _id: req.params.id, ...notDeleted() });
    if (!item) {
      return res.status(404).json({ message: 'Configuration item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAllConfigurationItems = async (req, res) => {
  try {
    const { page, rowsPerPage, skip, limit } = parsePagination(req.query);
    const sortObject = parseSort(req.query, CI_SORT_FIELDS, 'className');
    const search = String(req.query.search || '').trim();
    const includeDeleted = req.query.includeDeleted === 'true';
    const status = req.query.status ? String(req.query.status) : '';

    const filter = includeDeleted ? {} : notDeleted();
    if (status) filter.status = status;
    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { className: { $regex: search, $options: 'i' } },
            { serialNumber: { $regex: search, $options: 'i' } },
            { brandName: { $regex: search, $options: 'i' } },
            { modelName: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      ConfigurationItem.find(filter).sort(sortObject).skip(skip).limit(limit),
      ConfigurationItem.countDocuments(filter),
    ]);

    res.status(200).json({ items, total, page, rowsPerPage });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      message: status === 400 ? error.message : 'Internal server error',
      error: error.message,
    });
  }
};

exports.toggleConfigurationItemStatus = async (req, res) => {
  const status = req.body.status || decodeURIComponent(req.params.status || '');
  try {
    const item = await ConfigurationItem.findOne({ _id: req.params.id, ...notDeleted() });
    if (!item) {
      return res.status(404).json({ message: 'Configuration item not found' });
    }
    const validStatuses = ['In use', 'stock', 'retired', 'missing', 'damaged'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    item.status = status;
    const updatedItem = await item.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'status_change',
      entityType: 'configurationItem',
      entityId: updatedItem._id,
      meta: { status },
    });
    res.status(200).json({
      message: `Configuration item status updated to ${status}`,
      item: updatedItem,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.softDeleteConfigurationItem = async (req, res) => {
  try {
    const item = await ConfigurationItem.findOne({ _id: req.params.id, ...notDeleted() });
    if (!item) {
      return res.status(404).json({ message: 'Configuration item not found' });
    }
    item.deletedAt = new Date();
    await item.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'soft_delete',
      entityType: 'configurationItem',
      entityId: item._id,
    });
    res.status(200).json({ message: 'Configuration item soft-deleted', item });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.restoreConfigurationItem = async (req, res) => {
  try {
    const item = await ConfigurationItem.findById(req.params.id);
    if (!item || !item.deletedAt) {
      return res.status(404).json({ message: 'Deleted configuration item not found' });
    }
    item.deletedAt = null;
    await item.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'restore',
      entityType: 'configurationItem',
      entityId: item._id,
    });
    res.status(200).json({ message: 'Configuration item restored', item });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.importConfigurationItems = async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items must be a non-empty array' });
  }
  if (items.length > 1000) {
    return res.status(400).json({ message: 'Import limited to 1000 rows per request' });
  }

  const required = ['className', 'serialNumber', 'brandName', 'modelName', 'location'];
  const created = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const row = items[i] || {};
    const missing = required.filter((field) => !row[field]);
    if (missing.length) {
      errors.push({
        index: i,
        serialNumber: row.serialNumber,
        message: `Missing fields: ${missing.join(', ')}`,
      });
      continue;
    }

    try {
      const payload = {
        className: String(row.className).trim(),
        serialNumber: String(row.serialNumber).trim(),
        brandName: String(row.brandName).trim(),
        modelName: String(row.modelName).trim(),
        location: String(row.location).trim(),
        status:
          row.status && ['In use', 'stock', 'retired', 'missing', 'damaged'].includes(row.status)
            ? row.status
            : 'stock',
      };
      const item = await ConfigurationItem.create(payload);
      created.push(item);
    } catch (error) {
      errors.push({
        index: i,
        serialNumber: row.serialNumber,
        message: error.code === 11000 ? 'Duplicate serialNumber' : error.message,
      });
    }
  }

  await recordAudit({
    actorId: req.user?.id,
    actorUsername: req.user?.username,
    action: 'import',
    entityType: 'configurationItem',
    meta: { createdCount: created.length, errorCount: errors.length },
  });

  res.status(created.length ? 201 : 400).json({
    message: `Imported ${created.length} of ${items.length} items`,
    createdCount: created.length,
    errorCount: errors.length,
    created,
    errors,
  });
};
