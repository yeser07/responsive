const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const RefreshToken = require('../models/refreshToken');

exports.list = async (req, res) => {
  try {
    const admins = await Admin.find({}, 'username').sort({ username: 1 }).lean();
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await Admin.findOne({ username: String(username).trim() });
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username: String(username).trim(),
      passwordHash,
    });

    res.status(201).json({ _id: admin._id, username: admin.username });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count <= 1) {
      return res.status(400).json({ message: 'Cannot delete the last admin' });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await RefreshToken.deleteMany({ adminId: admin._id });
    await admin.deleteOne();

    res.status(200).json({ message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
