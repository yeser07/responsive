const mongoose = require('mongoose');
const { Schema } = mongoose;

const letterSchema = new Schema({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    unique: true,
  },
  creationDate: {
    type: Date,
    default: Date.now,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Letter', letterSchema);
