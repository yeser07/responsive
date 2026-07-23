const ROLES = ['viewer', 'operator', 'admin'];

const ROLE_RANK = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

function requireRole(...allowed) {
  const allowedSet = allowed.length ? allowed : ['admin'];
  return (req, res, next) => {
    const role = req.user?.role || 'viewer';
    if (!allowedSet.includes(role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

function requireMinRole(minRole) {
  const min = ROLE_RANK[minRole] || 3;
  return (req, res, next) => {
    const role = req.user?.role || 'viewer';
    if ((ROLE_RANK[role] || 0) < min) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    return next();
  };
}

module.exports = { requireRole, requireMinRole, ROLES, ROLE_RANK };
