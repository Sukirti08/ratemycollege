const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      enum: [
        'Assistant Professor',
        'Associate Professor',
        'Professor',
        'HOD',
        'Dean',
        'Visiting Faculty',
      ],
    },
    ratings: {
      overall: { type: Number, default: 0, min: 0, max: 5 },
      teachingClarity: { type: Number, default: 0, min: 0, max: 5 },
      examDifficulty: { type: Number, default: 0, min: 0, max: 5 },
      accessibility: { type: Number, default: 0, min: 0, max: 5 },
      researchSupport: { type: Number, default: 0, min: 0, max: 5 },
      gradingFairness: { type: Number, default: 0, min: 0, max: 5 },
    },
    tags: [
      {
        tag: { type: String, trim: true },
        count: { type: Number, default: 1 },
      },
    ],
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

professorSchema.index({ college: 1 });
professorSchema.index({ department: 1 });

module.exports = mongoose.model('Professor', professorSchema);
