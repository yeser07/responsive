const mongoose = require('mongoose');
const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ['configurationItem', 'assignment'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    uploadedBy: { type: String, default: null },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

attachmentSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
