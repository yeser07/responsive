const UserOwner = require('../models/userOwner');
const { parsePagination, parseSort } = require('../utils/pagination');
const { recordAudit } = require('../utils/audit');

const USER_SORT_FIELDS = ['name', 'logonUser', 'jobDescription', 'status', 'createdAt'];

function notDeleted() {
  return { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
}

exports.getAllUsers = async (req, res) => {
  try {
    const { page, rowsPerPage, skip, limit } = parsePagination(req.query);
    const sortObject = parseSort(req.query, USER_SORT_FIELDS, 'name');
    const search = String(req.query.search || '').trim();
    const includeDeleted = req.query.includeDeleted === 'true';

    const filter = includeDeleted ? {} : notDeleted();
    const status = String(req.query.status || '').trim();
    if (status && ['active', 'inactive'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { logonUser: { $regex: search, $options: 'i' } },
            { jobDescription: { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      UserOwner.find(filter).sort(sortObject).skip(skip).limit(limit),
      UserOwner.countDocuments(filter),
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

exports.getUserById = async (req, res) => {
  try {
    const user = await UserOwner.findOne({ _id: req.params.id, ...notDeleted() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = new UserOwner(req.body);
    const savedUser = await user.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'create',
      entityType: 'userOwner',
      entityId: savedUser._id,
    });
    res.status(201).json({ message: 'User created successfully', user: savedUser });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updatedUser = await UserOwner.findOneAndUpdate(
      { _id: req.params.id, ...notDeleted() },
      req.body,
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'update',
      entityType: 'userOwner',
      entityId: updatedUser._id,
    });
    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await UserOwner.findOne({ _id: req.params.id, ...notDeleted() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.status = user.status === 'active' ? 'inactive' : 'active';
    const updatedUser = await user.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'status_change',
      entityType: 'userOwner',
      entityId: updatedUser._id,
      meta: { status: updatedUser.status },
    });
    res.status(200).json({
      message: `User status updated to ${updatedUser.status}`,
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.softDeleteUser = async (req, res) => {
  try {
    const user = await UserOwner.findOne({ _id: req.params.id, ...notDeleted() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.deletedAt = new Date();
    user.status = 'inactive';
    await user.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'soft_delete',
      entityType: 'userOwner',
      entityId: user._id,
    });
    res.status(200).json({ message: 'User soft-deleted', user });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const user = await UserOwner.findById(req.params.id);
    if (!user || !user.deletedAt) {
      return res.status(404).json({ message: 'Deleted user not found' });
    }
    user.deletedAt = null;
    await user.save();
    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'restore',
      entityType: 'userOwner',
      entityId: user._id,
    });
    res.status(200).json({ message: 'User restored', user });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.importUserOwners = async (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items must be a non-empty array' });
  }
  if (items.length > 1000) {
    return res.status(400).json({ message: 'Import limited to 1000 rows per request' });
  }

  const required = ['name', 'logonUser', 'jobDescription'];
  const created = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const row = items[i] || {};
    const missing = required.filter((field) => !row[field]);
    if (missing.length) {
      errors.push({
        index: i,
        logonUser: row.logonUser,
        message: `Missing fields: ${missing.join(', ')}`,
      });
      continue;
    }

    try {
      const payload = {
        name: String(row.name).trim(),
        logonUser: String(row.logonUser).trim(),
        jobDescription: String(row.jobDescription).trim(),
        status: row.status && ['active', 'inactive'].includes(row.status) ? row.status : 'active',
      };
      const user = await UserOwner.create(payload);
      created.push(user);
    } catch (error) {
      errors.push({
        index: i,
        logonUser: row.logonUser,
        message: error.code === 11000 ? 'Duplicate logonUser' : error.message,
      });
    }
  }

  await recordAudit({
    actorId: req.user?.id,
    actorUsername: req.user?.username,
    action: 'import',
    entityType: 'userOwner',
    meta: { createdCount: created.length, errorCount: errors.length },
  });

  res.status(created.length ? 201 : 400).json({
    message: `Imported ${created.length} of ${items.length} users`,
    createdCount: created.length,
    errorCount: errors.length,
    created,
    errors,
  });
};
