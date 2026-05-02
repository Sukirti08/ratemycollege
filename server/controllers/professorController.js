const Professor = require('../models/Professor');
const ProfessorReview = require('../models/ProfessorReview');
const User = require('../models/User');

// GET /professors/:id
const getProfessorById = async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id).populate('college', 'name shortName');
    if (!professor) return res.status(404).json({ message: 'Professor not found' });

    const reviews = await ProfessorReview.find({ professor: req.params.id }).select(
      'batchYear branch ratings tags text helpfulVotes createdAt'
    );

    const formattedReviews = reviews.map((r) => ({
      batchYear: r.batchYear,
      branch: r.branch,
      ratings: r.ratings,
      tags: r.tags,
      text: r.text,
      helpfulVotes: r.helpfulVotes ? r.helpfulVotes.length : 0,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({ professor, reviews: formattedReviews });
  } catch (err) {
    console.error('getProfessorById error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /professors/:id/reviews
const submitProfessorReview = async (req, res) => {
  try {
    const { professorId } = req.params;
    const { ratings, tags, text, batchYear, branch } = req.body;
    const author = req.user._id;

    const existing = await ProfessorReview.findOne({ professor: professorId, author });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this professor.' });
    }

    const review = await ProfessorReview.create({
      professor: professorId,
      author,
      ratings,
      tags,
      text,
      batchYear,
      branch,
    });

    // Recalculate professor ratings
    const allReviews = await ProfessorReview.find({ professor: professorId });
    const professor = await Professor.findById(professorId);

    const ratingDimensions = Object.keys(ratings);
    const newRatings = {};

    for (const dim of ratingDimensions) {
      const values = allReviews.map((r) => r.ratings[dim]).filter((v) => v != null);
      newRatings[dim] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    const dimValues = Object.values(newRatings);
    newRatings.overall = dimValues.length
      ? dimValues.reduce((a, b) => a + b, 0) / dimValues.length
      : 0;

    professor.ratings = newRatings;

    // Update tag counts
    for (const tag of tags || []) {
      const existing = professor.tags.find((t) => t.tag === tag);
      if (existing) {
        existing.count += 1;
      } else {
        professor.tags.push({ tag, count: 1 });
      }
    }

    professor.tags.sort((a, b) => b.count - a.count);
    professor.tags = professor.tags.slice(0, 10);

    professor.reviewCount = allReviews.length;
    await professor.save();

    return res.status(201).json(review);
  } catch (err) {
    console.error('submitProfessorReview error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /professors/top
const getTopProfessors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { reviewCount: { $gt: 0 } };
    if (req.query.college) filter.college = req.query.college;

    const total = await Professor.countDocuments(filter);
    const professors = await Professor.find(filter)
      .sort({ 'ratings.overall': -1 })
      .skip(skip)
      .limit(limit)
      .populate('college', 'name shortName');

    return res.status(200).json({
      professors,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getTopProfessors error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getProfessorById, submitProfessorReview, getTopProfessors };
