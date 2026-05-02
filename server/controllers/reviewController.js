const mongoose = require('mongoose');
const Review = require('../models/Review');
const College = require('../models/College');
const User = require('../models/User');
const { analyzeSentiment } = require('../utils/sentimentAnalyzer');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Recalculate and persist aggregated ratings for a college based on its active reviews.
 */
const recalculateCollegeRatings = async (collegeId) => {
  const pipeline = [
    {
      $match: {
        college: new mongoose.Types.ObjectId(collegeId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,
        overall: { $avg: '$ratings.overall' },
        teaching: { $avg: '$ratings.teaching' },
        placements: { $avg: '$ratings.placements' },
        infrastructure: { $avg: '$ratings.infrastructure' },
        hostel: { $avg: '$ratings.hostel' },
        research: { $avg: '$ratings.research' },
        count: { $sum: 1 },
      },
    },
  ];

  const [result] = await Review.aggregate(pipeline);

  if (result) {
    await College.findByIdAndUpdate(collegeId, {
      'ratings.overall': parseFloat((result.overall || 0).toFixed(2)),
      'ratings.teaching': parseFloat((result.teaching || 0).toFixed(2)),
      'ratings.placements': parseFloat((result.placements || 0).toFixed(2)),
      'ratings.infrastructure': parseFloat((result.infrastructure || 0).toFixed(2)),
      'ratings.hostel': parseFloat((result.hostel || 0).toFixed(2)),
      'ratings.research': parseFloat((result.research || 0).toFixed(2)),
      reviewCount: result.count,
    });
  } else {
    // No active reviews left
    await College.findByIdAndUpdate(collegeId, {
      'ratings.overall': 0,
      'ratings.teaching': 0,
      'ratings.placements': 0,
      'ratings.infrastructure': 0,
      'ratings.hostel': 0,
      'ratings.research': 0,
      reviewCount: 0,
    });
  }
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /reviews
 */
const submitReview = async (req, res) => {
  try {
    const { collegeId, ratings, text, tags, batchYear, branch, isAnonymous } = req.body;

    if (!collegeId || !ratings || !text) {
      return res.status(400).json({ success: false, message: 'collegeId, ratings, and text are required.' });
    }

    // Check duplicate
    const existing = await Review.findOne({ college: collegeId, author: req.user._id });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this college.' });
    }

    // Sentiment analysis
    const sentimentScore = analyzeSentiment(text);

    const review = await Review.create({
      college: collegeId,
      author: req.user._id,
      ratings,
      text,
      tags: tags || [],
      batchYear,
      branch,
      isAnonymous: !!isAnonymous,
      sentimentScore,
      isVerified: req.user.isVerified,
      isActive: true,
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reviewsWritten: review._id },
      $inc: { karmaPoints: 10 },
    });

    // Recalculate college ratings
    await recalculateCollegeRatings(collegeId);

    // Return review without author
    const safeReview = review.toObject();
    delete safeReview.author;

    return res.status(201).json({ success: true, review: safeReview });
  } catch (err) {
    console.error('submitReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /reviews/:id/helpful
 */
const toggleHelpfulVote = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const userId = req.user._id;
    const alreadyVoted = review.helpfulVotes.some((id) => id.equals(userId));

    if (alreadyVoted) {
      review.helpfulVotes.pull(userId);
    } else {
      review.helpfulVotes.push(userId);
      // Award karma to review author on add
      User.findByIdAndUpdate(review.author, { $inc: { karmaPoints: 2 } }).exec();
    }

    if (review.helpfulVotes.length >= 10) {
      review.isCommunityVerified = true;
    }

    await review.save();

    return res.json({
      success: true,
      helpful: review.helpfulVotes.length,
      voted: !alreadyVoted,
    });
  } catch (err) {
    console.error('toggleHelpfulVote error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * PUT /reviews/:id/flag
 */
const flagReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const userId = req.user._id;
    const alreadyFlagged = review.flaggedBy.some((id) => id.equals(userId));
    if (alreadyFlagged) {
      return res.status(400).json({ success: false, message: 'You have already flagged this review.' });
    }

    review.flaggedBy.push(userId);

    // Auto-hide after threshold
    if (review.flaggedBy.length >= 5) {
      review.isActive = false;
    }

    await review.save();

    return res.json({ success: true, message: 'Review flagged.' });
  } catch (err) {
    console.error('flagReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * DELETE /reviews/:id
 */
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    if (!review.author.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this review.' });
    }

    // Soft delete
    review.isActive = false;
    await review.save();

    // Remove from user's reviewsWritten
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { reviewsWritten: review._id },
    });

    // Recalculate college ratings
    await recalculateCollegeRatings(review.college);

    return res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    console.error('deleteReview error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /reviews/question
 */
const addQuestion = async (req, res) => {
  try {
    const Question = require('../models/Question');
    const { collegeId, text } = req.body;

    if (!collegeId || !text) {
      return res.status(400).json({ success: false, message: 'collegeId and text are required.' });
    }

    const question = await Question.create({
      college: collegeId,
      askedBy: req.user._id,
      text,
      answers: [],
    });

    return res.status(201).json({ success: true, question });
  } catch (err) {
    console.error('addQuestion error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * POST /reviews/question/:questionId/answer
 */
const answerQuestion = async (req, res) => {
  try {
    const Question = require('../models/Question');
    const { text } = req.body;
    const { questionId } = req.params;

    if (!text) {
      return res.status(400).json({ success: false, message: 'text is required.' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    question.answers.push({
      answeredBy: req.user._id,
      text,
      isVerifiedStudent: req.user.isVerified,
      createdAt: new Date(),
    });

    await question.save();

    const populated = await question.populate([
      { path: 'askedBy', select: 'name' },
      { path: 'answers.answeredBy', select: 'name' },
    ]);

    return res.json({ success: true, question: populated });
  } catch (err) {
    console.error('answerQuestion error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  submitReview,
  toggleHelpfulVote,
  flagReview,
  deleteReview,
  addQuestion,
  answerQuestion,
};
