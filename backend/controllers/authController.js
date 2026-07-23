const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const RefreshToken = require('../models/refreshToken');
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

    res.status(200).json({
      message: 'Login successful',
      user: { username: admin.username },
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
      user: { username: admin.username },
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
  res.status(200).json({ user: { username: req.user.username } });
};

exports.ensureDefaultAdmin = async () => {
  const count = await Admin.countDocuments();
  if (count > 0) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await Admin.create({ username, passwordHash });
  console.log(`Default admin created (username: ${username})`);
};
