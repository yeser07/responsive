const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const RefreshToken = require('../models/refreshToken');
const { recordAudit } = require('../utils/audit');
const {
  getSecrets,
  parseDurationToMs,
  hashToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
} = require('../utils/authCookies');

function publicUser(admin) {
  return {
    username: admin.username,
    role: admin.role || 'admin',
    mustChangePassword: Boolean(admin.mustChangePassword),
  };
}

async function issueSession(res, admin) {
  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);
  const { refreshExpires } = getSecrets();

  await RefreshToken.create({
    adminId: admin._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpires)),
  });

  setAuthCookies(res, accessToken, refreshToken);
}

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await issueSession(res, admin);
    await recordAudit({
      actorId: admin._id,
      actorUsername: admin.username,
      action: 'login',
      entityType: 'admin',
      entityId: admin._id,
    });

    res.status(200).json({
      message: 'Login successful',
      user: publicUser(admin),
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.refresh = async (req, res) => {
  const rawToken = getRefreshTokenFromRequest(req);
  if (!rawToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const { refreshSecret } = getSecrets();
    let payload;
    try {
      payload = jwt.verify(rawToken, refreshSecret);
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    if (payload.type !== 'refresh') {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const admin = await Admin.findById(payload.id);
    if (!admin) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    stored.revokedAt = new Date();
    await stored.save();

    await issueSession(res, admin);

    res.status(200).json({
      message: 'Token refreshed',
      user: publicUser(admin),
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const rawToken = getRefreshTokenFromRequest(req);
    if (rawToken) {
      await RefreshToken.findOneAndUpdate(
        { tokenHash: hashToken(rawToken) },
        { revokedAt: new Date() }
      );
    }
    clearAuthCookies(res);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    clearAuthCookies(res);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('username role mustChangePassword');
    if (!admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    res.status(200).json({ user: publicUser(admin) });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.mustChangePassword = false;
    await admin.save();

    await issueSession(res, admin);
    await recordAudit({
      actorId: admin._id,
      actorUsername: admin.username,
      action: 'change_password',
      entityType: 'admin',
      entityId: admin._id,
    });

    res.status(200).json({
      message: 'Password updated',
      user: publicUser(admin),
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.ensureDefaultAdmin = async () => {
  const seedEnabled = process.env.SEED_DEFAULT_ADMIN !== 'false';
  if (!seedEnabled) {
    console.log('Default admin seed skipped (SEED_DEFAULT_ADMIN=false)');
    return;
  }

  const count = await Admin.countDocuments();
  if (count > 0) return;

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD is required to seed the first admin in production');
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  const isDefaultPassword = !process.env.ADMIN_PASSWORD || password === 'admin123';

  await Admin.create({
    username,
    passwordHash,
    role: 'admin',
    mustChangePassword: isDefaultPassword,
  });
  console.log(`Default admin created (username: ${username}, mustChangePassword: ${isDefaultPassword})`);
};
