const UserOwner = require('../models/userOwner');
const { ConfigurationItem } = require('../models/configurationItem');
const Assignment = require('../models/assignment');

function toCsv(rows, headers) {
  const escape = (value) => {
    const text = String(value ?? '');
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

exports.exportUsers = async (req, res) => {
  try {
    const users = await UserOwner.find({
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
      .sort({ name: 1 })
      .lean();
    const headers = ['name', 'logonUser', 'jobDescription', 'status'];
    const csv = toCsv(users, headers);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="user_owners.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.exportCis = async (req, res) => {
  try {
    const items = await ConfigurationItem.find({
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
      .sort({ serialNumber: 1 })
      .lean();
    const headers = ['className', 'serialNumber', 'brandName', 'modelName', 'location', 'status'];
    const csv = toCsv(items, headers);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="configuration_items.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.exportAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('userOwnerId', 'name logonUser')
      .populate('configurationItemId', 'serialNumber brandName modelName')
      .sort({ assignmentDate: -1 })
      .lean();

    const rows = assignments.map((a) => ({
      userName: a.userOwnerId?.name || '',
      logonUser: a.userOwnerId?.logonUser || '',
      serialNumber: a.configurationItemId?.serialNumber || '',
      brandName: a.configurationItemId?.brandName || '',
      modelName: a.configurationItemId?.modelName || '',
      status: a.status,
      assignmentDate: a.assignmentDate ? new Date(a.assignmentDate).toISOString() : '',
      returnDate: a.returnDate ? new Date(a.returnDate).toISOString() : '',
    }));

    const headers = [
      'userName',
      'logonUser',
      'serialNumber',
      'brandName',
      'modelName',
      'status',
      'assignmentDate',
      'returnDate',
    ];
    const csv = toCsv(rows, headers);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="assignments.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
