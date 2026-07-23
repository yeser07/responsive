const Reviewer = require('../models/reviewer');
const { parsePagination, parseSort } = require('../utils/pagination');
const { recordAudit } = require('../utils/audit');

const REVIEWER_SORT_FIELDS = ['name', 'title', 'active', 'createdAt'];

function notDeleted() {
  return { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
}

exports.getAllReviewers = async (req, res) => {
  try {
    const { page, rowsPerPage, skip, limit } = parsePagination(req.query);
    const sortObject = parseSort(req.query, REVIEWER_SORT_FIELDS, 'name');
    const search = String(req.query.search || '').trim();
    const includeDeleted = req.query.includeDeleted === 'true';
    const status = String(req.query.status || '').trim();

    const filter = includeDeleted ? {} : notDeleted();
    if (status === 'active') filter.active = true;
    if (status === 'inactive') filter.active = false;

    if (search) {
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { title: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      Reviewer.find(filter)
        .select('-signatureDataUrl')
        .sort(sortObject)
        .skip(skip)
        .limit(limit),
      Reviewer.countDocuments(filter),
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

exports.getReviewerById = async (req, res) => {
  try {
    const reviewer = await Reviewer.findOne({ _id: req.params.id, ...notDeleted() });
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    res.status(200).json(reviewer);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.createReviewer = async (req, res) => {
  try {
    const { name, title, signatureDataUrl, active = true } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!signatureDataUrl) {
      return res.status(400).json({ message: 'Signature is required' });
    }

    const reviewer = await Reviewer.create({
      name: String(name).trim(),
      title: title ? String(title).trim() : 'Coordinador de TI',
      signatureDataUrl,
      active: Boolean(active),
    });

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'create',
      entityType: 'reviewer',
      entityId: reviewer._id,
    });

    const safe = reviewer.toObject();
    delete safe.signatureDataUrl;
    res.status(201).json({ message: 'Reviewer created successfully', reviewer: safe });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateReviewer = async (req, res) => {
  try {
    const { name, title, signatureDataUrl, active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (title !== undefined) updates.title = String(title).trim();
    if (signatureDataUrl !== undefined) updates.signatureDataUrl = signatureDataUrl;
    if (active !== undefined) updates.active = Boolean(active);

    if (updates.name === '') {
      return res.status(400).json({ message: 'Name is required' });
    }

    const reviewer = await Reviewer.findOneAndUpdate(
      { _id: req.params.id, ...notDeleted() },
      updates,
      { new: true }
    );
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'update',
      entityType: 'reviewer',
      entityId: reviewer._id,
    });

    const safe = reviewer.toObject();
    delete safe.signatureDataUrl;
    res.status(200).json({ message: 'Reviewer updated successfully', reviewer: safe });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.toggleReviewerStatus = async (req, res) => {
  try {
    const reviewer = await Reviewer.findOne({ _id: req.params.id, ...notDeleted() });
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }
    reviewer.active = !reviewer.active;
    await reviewer.save();

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'status_change',
      entityType: 'reviewer',
      entityId: reviewer._id,
      meta: { active: reviewer.active },
    });

    const safe = reviewer.toObject();
    delete safe.signatureDataUrl;
    res.status(200).json({ message: 'Reviewer status updated', reviewer: safe });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.softDeleteReviewer = async (req, res) => {
  try {
    const reviewer = await Reviewer.findOneAndUpdate(
      { _id: req.params.id, ...notDeleted() },
      { deletedAt: new Date(), active: false },
      { new: true }
    );
    if (!reviewer) {
      return res.status(404).json({ message: 'Reviewer not found' });
    }

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'delete',
      entityType: 'reviewer',
      entityId: reviewer._id,
    });

    res.status(200).json({ message: 'Reviewer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
