const mongoose = require('mongoose');

const { Schema } = mongoose;
const userOwnerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  logonUser: {
    type: String,
    required: true,
    unique: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  
});

module.exports = mongoose.model('UserOwner', userOwnerSchema);