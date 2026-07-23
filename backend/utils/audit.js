const AuditLog = require('../models/auditLog');

async function recordAudit({
  actorId,
  actorUsername,
  action,
  entityType,
  entityId,
  meta,
}) {
  try {
    await AuditLog.create({
      actorId: actorId || null,
      actorUsername: actorUsername || 'system',
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      meta: meta || {},
    });
  } catch (error) {
    console.error('[audit] failed to record event', error.message);
  }
}

module.exports = { recordAudit };
