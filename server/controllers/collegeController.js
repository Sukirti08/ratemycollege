const mongoose = require('mongoose');
const College = require('../models/College');
const Review = require('../models/Review');

// ── Module-level stats cache ──────────────────────────────────────────────────
let statsCache = null;
let statsCacheTime = 0;
const STATS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map user-facing sortBy key to MongoDB field path */
const sortByToField = (sortBy) => {
  const map = {
    overall: 'ratings.overall',
    placements: 'ratings.placements',
    teaching: 'ratings.teaching',
    research: 'ratings.research',
  };
  return map[sortBy] || 'ratings.overall';
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /colleges
 * Query: search, type, sortBy, page, limit
 */
const getAllColleges = async (req, res) => {
  try {
    const { search, type, sortBy, page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { shortName: regex }];
    }
    if (type) filter.type = type;

    const sortField = sortByToField(sortBy);
    const sort = { [sortField]: -1 };

    const [colleges, total] = await Promise.all([
      College.find(filter).sort(sort).skip(skip).limit(limitNum),
      College.countDocuments(filter),
    ]);

    // Increment weeklyViewCount for each viewed college
    if (colleges.length > 0) {
      const ids = colleges.map((c) => c._id);
      College.updateMany({ _id: { $in: ids } }, { $inc: { weeklyViewCount: 1 } }).exec();
    }

    return res.json({
      success: true,
      colleges,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('getAllColleges error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/:id
 */
const getCollegeById = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    // Increment viewCount (fire-and-forget)
    College.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

    return res.json({ success: true, college });
  } catch (err) {
    console.error('getCollegeById error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/:id/reviews
 * Query: sort (createdAt | -createdAt | helpful), branch, batch, page, limit
 */
const getCollegeReviews = async (req, res) => {
  try {
    const { id: collegeId } = req.params;
    const { sort = '-createdAt', branch, batch, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { college: collegeId, isActive: true };
    if (branch) filter.branch = branch;
    if (batch) filter.batchYear = parseInt(batch, 10);

    // Projection: NEVER expose author details
    const projection = {
      _id: 1,
      batchYear: 1,
      branch: 1,
      ratings: 1,
      text: 1,
      tags: 1,
      helpfulVotes: 1,
      flaggedBy: 1,
      isVerified: 1,
      isCommunityVerified: 1,
      isSample: 1,
      createdAt: 1,
    };

    let reviews;
    let total;

    if (sort === 'helpful') {
      // Aggregate to sort by helpfulVotes array length
      const pipeline = [
        { $match: { ...filter, college: new mongoose.Types.ObjectId(collegeId) } },
        {
          $addFields: {
            helpfulCount: { $size: { $ifNull: ['$helpfulVotes', []] } },
            flaggedCount: { $size: { $ifNull: ['$flaggedBy', []] } },
          },
        },
        { $sort: { helpfulCount: -1 } },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limitNum },
              {
                $project: {
                  _id: 1,
                  batchYear: 1,
                  branch: 1,
                  ratings: 1,
                  text: 1,
                  tags: 1,
                  helpfulVotes: { $size: { $ifNull: ['$helpfulVotes', []] } },
                  flaggedBy: { $size: { $ifNull: ['$flaggedBy', []] } },
                  isVerified: 1,
                  isCommunityVerified: 1,
                  isSample: 1,
                  createdAt: 1,
                },
              },
            ],
            count: [{ $count: 'total' }],
          },
        },
      ];
      const [result] = await Review.aggregate(pipeline);
      reviews = result.data;
      total = result.count[0]?.total || 0;
    } else {
      const mongoSort = sort === 'createdAt' ? { createdAt: 1 } : { createdAt: -1 };
      [reviews, total] = await Promise.all([
        Review.find(filter, projection).sort(mongoSort).skip(skip).limit(limitNum).lean(),
        Review.countDocuments(filter),
      ]);
      // Map array lengths
      reviews = reviews.map((r) => ({
        ...r,
        helpfulVotes: Array.isArray(r.helpfulVotes) ? r.helpfulVotes.length : r.helpfulVotes,
        flaggedBy: Array.isArray(r.flaggedBy) ? r.flaggedBy.length : r.flaggedBy,
      }));
    }

    return res.json({
      success: true,
      reviews,
      total,
      page: pageNum,
      hasMore: skip + reviews.length < total,
    });
  } catch (err) {
    console.error('getCollegeReviews error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/:id/professors
 */
const getCollegeProfessors = async (req, res) => {
  try {
    // Lazy-require to avoid circular deps at module load time
    const Professor = require('../models/Professor');
    const professors = await Professor.find({ college: req.params.id });
    return res.json({ success: true, professors });
  } catch (err) {
    console.error('getCollegeProfessors error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/:id/placements
 */
const getCollegePlacements = async (req, res) => {
  try {
    const PlacementData = require('../models/PlacementData');
    const [college, records] = await Promise.all([
      College.findById(req.params.id).select('claimedAvgPackage').lean(),
      PlacementData.find({ college: req.params.id }).select('company role ctcLPA batch branch isVerified isSample createdAt').sort({ createdAt: -1 }).lean()
    ]);

    if (!records.length) {
      return res.json({
        success: true,
        stats: { avgCTC: 0, maxCTC: 0, minCTC: 0, verifiedCount: 0, totalCount: 0 },
        claimedAvg: college?.claimedAvgPackage || 0,
        byCompany: [],
        byBranch: [],
        records: [],
      });
    }

    const ctcValues = records.map((r) => r.ctcLPA).filter(Boolean);
    const avgCTC = ctcValues.length ? ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length : 0;
    const maxCTC = ctcValues.length ? Math.max(...ctcValues) : 0;
    const minCTC = ctcValues.length ? Math.min(...ctcValues) : 0;
    const verifiedCount = records.filter((r) => r.isVerified).length;

    // Group by company
    const companyMap = Object.create(null);
    records.forEach((r) => {
      if (!r.company) return;
      if (!companyMap[r.company]) companyMap[r.company] = { count: 0, total: 0 };
      companyMap[r.company].count += 1;
      if (r.ctcLPA) companyMap[r.company].total += r.ctcLPA;
    });
    const byCompany = Object.entries(companyMap).map(([company, data]) => ({
      company,
      count: data.count,
      avgCTC: data.count ? data.total / data.count : 0,
    }));

    // Group by branch
    const branchMap = Object.create(null);
    records.forEach((r) => {
      if (!r.branch) return;
      if (!branchMap[r.branch]) branchMap[r.branch] = { count: 0, total: 0 };
      branchMap[r.branch].count += 1;
      if (r.ctcLPA) branchMap[r.branch].total += r.ctcLPA;
    });
    const byBranch = Object.entries(branchMap).map(([branch, data]) => ({
      branch,
      count: data.count,
      avgCTC: data.count ? data.total / data.count : 0,
    }));

    return res.json({
      success: true,
      stats: { avgCTC, maxCTC, minCTC, verifiedCount, totalCount: records.length },
      claimedAvg: college?.claimedAvgPackage || 0,
      byCompany,
      byBranch,
      records: records.slice(0, 20),
    });
  } catch (err) {
    console.error('getCollegePlacements error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/:id/questions
 */
const getCollegeQuestions = async (req, res) => {
  try {
    const Question = require('../models/Question');
    const questions = await Question.find({ college: req.params.id })
      .sort({ createdAt: -1 })
      .populate('askedBy', 'name')
      .populate('answers.answeredBy', 'name');
    return res.json({ success: true, questions });
  } catch (err) {
    console.error('getCollegeQuestions error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/leaderboard
 * Query: category, type, limit
 */
const getLeaderboard = async (req, res) => {
  try {
    const { category = 'overall', type, limit = 10 } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const sortField = sortByToField(category);

    const filter = {};
    if (type) filter.type = type;

    const colleges = await College.find(filter)
      .select('name shortName type ratings reviewCount')
      .sort({ [sortField]: -1 })
      .limit(limitNum);

    return res.json({ success: true, colleges });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/stats
 * Cached for 1 hour.
 */
const getCollegeStats = async (req, res) => {
  try {
    const now = Date.now();
    if (statsCache && now - statsCacheTime < STATS_CACHE_TTL) {
      return res.json({ success: true, ...statsCache });
    }

    const Professor = require('../models/Professor');
    const [totalColleges, totalReviews, totalProfessors, avgRatingResult] = await Promise.all([
      College.countDocuments(),
      Review.countDocuments({ isActive: true }),
      Professor.countDocuments(),
      College.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$ratings.overall' } } },
      ]),
    ]);

    const avgRating = avgRatingResult[0]?.avgRating
      ? parseFloat(avgRatingResult[0].avgRating.toFixed(2))
      : 0;

    statsCache = { totalColleges, totalReviews, totalProfessors, avgRating };
    statsCacheTime = now;

    return res.json({ success: true, ...statsCache });
  } catch (err) {
    console.error('getCollegeStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /colleges/trending
 */
const getTrending = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [trendingColleges, recentlyReviewedAgg] = await Promise.all([
      College.find()
        .select('name shortName type ratings reviewCount weeklyViewCount')
        .sort({ weeklyViewCount: -1 })
        .limit(5),
      Review.aggregate([
        { $match: { isActive: true, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$college', recentCount: { $sum: 1 } } },
        { $sort: { recentCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'colleges',
            localField: '_id',
            foreignField: '_id',
            as: 'college',
          },
        },
        { $unwind: '$college' },
        {
          $project: {
            _id: 0,
            recentCount: 1,
            'college._id': 1,
            'college.name': 1,
            'college.shortName': 1,
            'college.type': 1,
            'college.ratings': 1,
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      trendingColleges,
      recentlyReviewed: recentlyReviewedAgg,
    });
  } catch (err) {
    console.error('getTrending error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllColleges,
  getCollegeById,
  getCollegeReviews,
  getCollegeProfessors,
  getCollegePlacements,
  getCollegeQuestions,
  getLeaderboard,
  getCollegeStats,
  getTrending,
};
