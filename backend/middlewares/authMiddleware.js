const jwt = require('jsonwebtoken');
const { getSecrets, getAccessTokenFromRequest } = require('../utils/authCookies');

function authMiddleware(req, res, next) {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const { accessSecret } = getSecrets();
    const payload = jwt.verify(token, accessSecret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
