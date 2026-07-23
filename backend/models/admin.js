const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'operator', 'admin'],
      default: 'admin',
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    ssoSubject: {
      type: String,
      default: null,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
