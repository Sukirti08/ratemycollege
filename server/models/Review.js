const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    batchYear: {
      type: Number,
      required: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
    },
    ratings: {
      overall: { type: Number, required: true, min: 1, max: 5 },
      teaching: { type: Number, required: true, min: 1, max: 5 },
      placements: { type: Number, required: true, min: 1, max: 5 },
      research: { type: Number, required: true, min: 1, max: 5 },
      hostel: { type: Number, required: true, min: 1, max: 5 },
      infrastructure: { type: Number, required: true, min: 1, max: 5 },
      facultyAccessibility: { type: Number, required: true, min: 1, max: 5 },
    },
    text: {
      type: String,
      required: true,
      minlength: 100,
      maxlength: 2000,
      trim: true,
    },
    tags: [{ type: String, trim: true }],
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    flaggedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true, // set false when flaggedBy.length >= 5
    },
    isSample: { type: Boolean, default: false },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isCommunityVerified: {
      type: Boolean,
      default: false,
    },
    sentimentScore: {
      type: Number,
      default: 0,
      min: -1,
      max: 1,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ college: 1 });
reviewSchema.index({ author: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ college: 1, author: 1 }, { unique: true }); // one review per college per user

module.exports = mongoose.model('Review', reviewSchema);
