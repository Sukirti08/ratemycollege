const User = require('../models/User');
const Review = require('../models/Review');

// GET /users/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('college', 'name shortName');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /users/profile
const updateProfile = async (req, res) => {
  try {
    const { branch, batchYear } = req.body;

    if (batchYear !== undefined) {
      const year = parseInt(batchYear);
      if (isNaN(year) || year < 2000 || year > 2030) {
        return res.status(400).json({ message: 'batchYear must be between 2000 and 2030.' });
      }
    }

    const updateFields = {};
    if (branch !== undefined) updateFields.branch = branch;
    if (batchYear !== undefined) updateFields.batchYear = parseInt(batchYear);

    const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
      new: true,
      runValidators: true,
    }).populate('college', 'name shortName');

    return res.status(200).json(user);
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /users/profile/reviews
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ author: req.user._id }).populate(
      'college',
      'name shortName'
    );
    return res.status(200).json(reviews);
  } catch (err) {
    console.error('getMyReviews error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /users/insider-report
const submitInsiderReport = async (req, res) => {
  try {
    const { collegeId, semesterRating, highlights, concerns, batch } = req.body;
    const author = req.user._id;

    await Review.create({
      college: collegeId,
      author,
      ratings: { overall: semesterRating },
      text: `Highlights: ${highlights || ''}\n\nConcerns: ${concerns || ''}`,
      tags: ['insider-report'],
      batch,
    });

    await User.findByIdAndUpdate(author, { $inc: { karma: 5 } });

    return res.status(201).json({ message: 'Thank you for your insider report!' });
  } catch (err) {
    console.error('submitInsiderReport error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getProfile, updateProfile, getMyReviews, submitInsiderReport };
