const mongoose = require('mongoose');

const placementDataSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    ctcLPA: {
      type: Number,
      required: true,
      min: 1,
      max: 500,
    },
    offerLetterUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // true if offer letter uploaded and approved
    },
    batch: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

placementDataSchema.index({ college: 1 });
placementDataSchema.index({ batch: 1 });
placementDataSchema.index({ isVerified: 1 });

module.exports = mongoose.model('PlacementData', placementDataSchema);
