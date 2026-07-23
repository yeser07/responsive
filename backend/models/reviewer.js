const mongoose = require('mongoose');

const { Schema } = mongoose;

const reviewerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Coordinador de TI',
    },
    signatureDataUrl: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reviewerSchema.index({ deletedAt: 1 });
reviewerSchema.index({ active: 1, name: 1 });

module.exports = mongoose.model('Reviewer', reviewerSchema);
