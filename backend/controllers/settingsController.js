const LetterTemplate = require('../models/letterTemplate');
const { recordAudit } = require('../utils/audit');
const { getTemplateSettings } = require('../services/letterService');

exports.getLetterTemplate = async (req, res) => {
  try {
    const template = await getTemplateSettings();
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateLetterTemplate = async (req, res) => {
  try {
    const { companyName, title, legalText, logoDataUrl } = req.body;
    const template = await LetterTemplate.findOneAndUpdate(
      { key: 'default' },
      {
        ...(companyName !== undefined ? { companyName } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(legalText !== undefined ? { legalText } : {}),
        ...(logoDataUrl !== undefined ? { logoDataUrl } : {}),
      },
      { new: true, upsert: true }
    );

    await recordAudit({
      actorId: req.user?.id,
      actorUsername: req.user?.username,
      action: 'update_template',
      entityType: 'letterTemplate',
      entityId: template._id,
    });

    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
