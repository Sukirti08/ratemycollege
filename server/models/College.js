const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    shortName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['IIT', 'NIT', 'IIIT', 'BITS', 'Other'],
      required: true,
    },
    location: {
      city: { type: String, trim: true },
      state: { type: String, trim: true },
    },
    website: {
      type: String,
      trim: true,
    },
    establishedYear: {
      type: Number,
    },
    branches: [String],
    ratings: {
      overall: { type: Number, default: 0, min: 0, max: 5 },
      teaching: { type: Number, default: 0, min: 0, max: 5 },
      placements: { type: Number, default: 0, min: 0, max: 5 },
      research: { type: Number, default: 0, min: 0, max: 5 },
      hostel: { type: Number, default: 0, min: 0, max: 5 },
      infrastructure: { type: Number, default: 0, min: 0, max: 5 },
      facultyAccessibility: { type: Number, default: 0, min: 0, max: 5 },
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    claimedAvgPackage: {
      type: Number,
      default: 0, // LPA
    },
    actualAvgPackage: {
      type: Number,
      default: 0, // crowdsourced LPA
    },
    topRecruiters: [String],
    emailDomains: [String], // e.g. ["iitb.ac.in"]
    viewCount: {
      type: Number,
      default: 0,
    },
    weeklyViewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);


collegeSchema.index({ type: 1 });
collegeSchema.index({ shortName: 1 });

module.exports = mongoose.model('College', collegeSchema);
