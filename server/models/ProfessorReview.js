const mongoose = require('mongoose');

const professorReviewSchema = new mongoose.Schema(
  {
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Professor',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      teachingClarity: { type: Number, required: true, min: 1, max: 5 },
      examDifficulty: { type: Number, required: true, min: 1, max: 5 },
      accessibility: { type: Number, required: true, min: 1, max: 5 },
      researchSupport: { type: Number, required: true, min: 1, max: 5 },
      gradingFairness: { type: Number, required: true, min: 1, max: 5 },
    },
    tags: [{ type: String, trim: true }],
    text: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 1000,
      trim: true,
    },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

professorReviewSchema.index({ professor: 1, author: 1 }, { unique: true }); // one review per professor per user

module.exports = mongoose.model('ProfessorReview', professorReviewSchema);
