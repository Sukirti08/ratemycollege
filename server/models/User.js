const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
    },
    branch: {
      type: String,
      default: '',
    },
    batchYear: {
      type: Number,
      min: 2000,
      max: 2030,
      default: null,
    },
    karmaPoints: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    reviewsWritten: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    flaggedReviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    sessionMessageCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model('User', userSchema);
