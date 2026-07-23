const UserOwner = require('../models/userOwner');
const { ConfigurationItem } = require('../models/configurationItem');
const Assignment = require('../models/assignment');
const Letter = require('../models/letter');

exports.globalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Query q must be at least 2 characters' });
    }

    const notDeleted = { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
    const regex = { $regex: q, $options: 'i' };

    const [users, cis, assignments, letters] = await Promise.all([
      UserOwner.find({
        ...notDeleted,
        $or: [{ name: regex }, { logonUser: regex }, { jobDescription: regex }],
      })
        .limit(10)
        .lean(),
      ConfigurationItem.find({
        ...notDeleted,
        $or: [
          { serialNumber: regex },
          { brandName: regex },
          { modelName: regex },
          { className: regex },
          { location: regex },
        ],
      })
        .limit(10)
        .lean(),
      Assignment.find({})
        .populate('userOwnerId', 'name logonUser')
        .populate('configurationItemId', 'serialNumber brandName modelName')
        .sort({ assignmentDate: -1 })
        .limit(40)
        .lean()
        .then((rows) =>
          rows
            .filter((row) => {
              const hay = [
                row.userOwnerId?.name,
                row.userOwnerId?.logonUser,
                row.configurationItemId?.serialNumber,
                row.configurationItemId?.brandName,
                row.status,
              ]
                .join(' ')
                .toLowerCase();
              return hay.includes(q.toLowerCase());
            })
            .slice(0, 10)
        ),
      Letter.find({})
        .populate({
          path: 'assignmentId',
          populate: [
            { path: 'userOwnerId', select: 'name' },
            { path: 'configurationItemId', select: 'serialNumber' },
          ],
        })
        .sort({ creationDate: -1 })
        .limit(40)
        .lean()
        .then((rows) =>
          rows
            .filter((row) => {
              const hay = [
                row.fileName,
                row.assignmentId?.userOwnerId?.name,
                row.assignmentId?.configurationItemId?.serialNumber,
              ]
                .join(' ')
                .toLowerCase();
              return hay.includes(q.toLowerCase());
            })
            .slice(0, 10)
        ),
    ]);

    res.status(200).json({ q, users, cis, assignments, letters });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
