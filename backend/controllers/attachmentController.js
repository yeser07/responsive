const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const Attachment = require('../models/attachment');
const { recordAudit } = require('../utils/audit');

exports.list = async (req, res) => {
  try {
    const { entityType, entityId } = req.query;
    if (!entityType || !entityId) {
      return res.status(400).json({ message: 'entityType and entityId are required' });
    }
    const items = await Attachment.find({ entityType, entityId }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { entityType, entityId, fileName, dataUrl, mimeType, note } = req.body;
    if (!entityType || !entityId || !fileName || !dataUrl) {
      return res.status(400).json({
        message: 'entityType, entityId, fileName and dataUrl are required',
      });
    }
    if (!['configurationItem', 'assignment'].includes(entityType)) {
      return res.status(400).json({ message: 'Invalid entityType' });
    }

    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      return res.status(400).json({ message: 'dataUrl must be a base64 data URL' });
    }

    const detectedMime = mimeType || match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Attachment too large (max 5MB)' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'attachments');
    await fse.ensureDir(uploadsDir);
    const safeName = `${Date.now()}_${String(fileName).replace(/[^\w.\-]+/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    await fse.writeFile(filePath, buffer);

    const attachment = await Attachment.create({
      entityType,
      entityId,
      fileName,
      filePath,
      mimeType: detectedMime,
      uploadedBy: req.user?.username || null,
      note: note || '',
    });

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'upload_attachment',
      entityType,
      entityId,
      meta: { attachmentId: attachment._id, fileName },
    });

    res.status(201).json(attachment);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.download = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({ message: 'File not found on disk' });
    }
    res.download(attachment.filePath, attachment.fileName);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
