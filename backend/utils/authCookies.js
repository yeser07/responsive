const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

function getSecrets() {
  return {
    accessSecret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret',
    accessExpires: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

function parseDurationToMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(String(duration));
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * mult[unit];
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
  };
}

function cookieOptions(maxAgeMs) {
  return {
    ...cookieBaseOptions(),
    maxAge: maxAgeMs,
  };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signAccessToken(admin) {
  const { accessSecret, accessExpires } = getSecrets();
  return jwt.sign(
    { id: admin._id.toString(), username: admin.username },
    accessSecret,
    { expiresIn: accessExpires }
  );
}

function signRefreshToken(admin) {
  const { refreshSecret, refreshExpires } = getSecrets();
  return jwt.sign(
    { id: admin._id.toString(), type: 'refresh', jti: crypto.randomUUID() },
    refreshSecret,
    { expiresIn: refreshExpires }
  );
}

function setAuthCookies(res, accessToken, refreshToken) {
  const { accessExpires, refreshExpires } = getSecrets();
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(parseDurationToMs(accessExpires)));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(parseDurationToMs(refreshExpires)));
}

function clearAuthCookies(res) {
  const opts = {
    ...cookieBaseOptions(),
    maxAge: 0,
  };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
}

function getAccessTokenFromRequest(req) {
  if (req.cookies?.[ACCESS_COOKIE]) {
    return req.cookies[ACCESS_COOKIE];
  }
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    return token;
  }
  return null;
}

function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_COOKIE] || null;
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  getSecrets,
  parseDurationToMs,
  hashToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
};
