const mongoose = require('mongoose');
const { Schema } = mongoose;

const assignmentSchema = new Schema({
  userOwnerId: {
    type: Schema.Types.ObjectId,
    ref: 'UserOwner',
    required: true,
  },
  configurationItemId: {
    type: Schema.Types.ObjectId,
    ref: 'ConfigurationItem',
    required: true,
  },
  reviewerId: {
    type: Schema.Types.ObjectId,
    ref: 'Reviewer',
    default: null,
  },
  assignmentDate: {
    type: Date,
    default: Date.now,
  },
  returnDate: {
    type: Date,
    default: null,
  },
  accessories: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    required: true,
    enum: ['assigned', 'returned'],
    default: 'assigned',
  },
});

module.exports = mongoose.model('Assignment', assignmentSchema);
