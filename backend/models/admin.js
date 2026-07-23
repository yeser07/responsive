const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminSchema = new Schema({
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
});

module.exports = mongoose.model('Admin', adminSchema);
