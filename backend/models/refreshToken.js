const mongoose = require('mongoose');
const { Schema } = mongoose;

const refreshTokenSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
