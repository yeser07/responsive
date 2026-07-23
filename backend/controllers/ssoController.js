const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  getSecrets,
  parseDurationToMs,
  hashToken,
} = require('../utils/authCookies');
const RefreshToken = require('../models/refreshToken');
const { recordAudit } = require('../utils/audit');

function ssoEnabled() {
  return (
    process.env.SSO_ENABLED === 'true' &&
    Boolean(process.env.SSO_AUTHORIZATION_URL) &&
    Boolean(process.env.SSO_TOKEN_URL) &&
    Boolean(process.env.SSO_CLIENT_ID) &&
    Boolean(process.env.SSO_CLIENT_SECRET) &&
    Boolean(process.env.SSO_REDIRECT_URI)
  );
}

exports.status = (req, res) => {
  res.status(200).json({
    enabled: ssoEnabled(),
    provider: process.env.SSO_PROVIDER_NAME || 'OIDC',
  });
};

exports.login = (req, res) => {
  if (!ssoEnabled()) {
    return res.status(404).json({ message: 'SSO is not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('sso_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: process.env.SSO_CLIENT_ID,
    redirect_uri: process.env.SSO_REDIRECT_URI,
    response_type: 'code',
    scope: process.env.SSO_SCOPES || 'openid profile email',
    state,
  });

  const url = `${process.env.SSO_AUTHORIZATION_URL}?${params.toString()}`;
  return res.redirect(url);
};

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

exports.callback = async (req, res) => {
  if (!ssoEnabled()) {
    return res.status(404).json({ message: 'SSO is not configured' });
  }

  const { code, state } = req.query;
  const expectedState = req.cookies?.sso_state;
  if (!code || !state || !expectedState || state !== expectedState) {
    return res.status(400).json({ message: 'Invalid SSO state' });
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: process.env.SSO_REDIRECT_URI,
      client_id: process.env.SSO_CLIENT_ID,
      client_secret: process.env.SSO_CLIENT_SECRET,
    });

    const tokenRes = await fetch(process.env.SSO_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!tokenRes.ok) {
      return res.status(401).json({ message: 'SSO token exchange failed' });
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(401).json({ message: 'SSO access token missing' });
    }

    let profile = {};
    if (process.env.SSO_USERINFO_URL) {
      const profileRes = await fetch(process.env.SSO_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (profileRes.ok) {
        profile = await profileRes.json();
      }
    }

    const subject = String(profile.sub || profile.email || profile.preferred_username || '');
    const username = String(
      profile.preferred_username || profile.email || profile.sub || `sso_${Date.now()}`
    ).slice(0, 80);

    if (!subject) {
      return res.status(401).json({ message: 'SSO profile missing subject' });
    }

    let admin = await Admin.findOne({ $or: [{ ssoSubject: subject }, { username }] });
    if (!admin) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
      admin = await Admin.create({
        username,
        passwordHash,
        role: process.env.SSO_DEFAULT_ROLE || 'viewer',
        mustChangePassword: false,
        ssoSubject: subject,
      });
    } else if (!admin.ssoSubject) {
      admin.ssoSubject = subject;
      await admin.save();
    }

    await issueSession(res, admin);
    await recordAudit({
      actorId: admin._id,
      actorUsername: admin.username,
      action: 'sso_login',
      entityType: 'admin',
      entityId: admin._id,
    });

    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontend}/`);
  } catch (error) {
    return res.status(500).json({ message: 'SSO callback failed', error: error.message });
  }
};
