const { generateToken, setTokenCookie, clearTokenCookie } = require('../utils/jwtHelper');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * GET /auth/google/callback
 * Passport has already authenticated the user; req.user is the Mongoose document.
 */
const googleCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${CLIENT_URL}/?error=invalid_college_email`);
    }

    const token = generateToken(req.user._id);
    setTokenCookie(res, token);

    return res.redirect(`${CLIENT_URL}/profile`);
  } catch (err) {
    console.error('googleCallback error:', err);
    return res.redirect(`${CLIENT_URL}/?error=invalid_college_email`);
  }
};

/**
 * POST /auth/logout
 */
const logout = (req, res) => {
  clearTokenCookie(res);
  return res.json({ success: true, message: 'Logged out' });
};

/**
 * GET /auth/me  (protected)
 * Returns the authenticated user without sensitive fields.
 */
const getMe = async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    const user = await req.user
      .populate('college', 'name shortName type')
      .execPopulate
      ? await req.user.populate('college', 'name shortName type')
      : req.user; // handle both mongoose v5 and v6+

    // For Mongoose 6+ populate is not chainable the same way – use User.findById
    const User = require('../models/User');
    const fullUser = await User.findById(req.user._id)
      .select('_id name email avatar college branch batchYear karmaPoints isVerified reviewsWritten')
      .populate('college', 'name shortName type');

    return res.json({
      success: true,
      user: {
        _id: fullUser._id,
        name: fullUser.name,
        email: fullUser.email,
        avatar: fullUser.avatar,
        college: fullUser.college,
        branch: fullUser.branch,
        batchYear: fullUser.batchYear,
        karmaPoints: fullUser.karmaPoints,
        isVerified: fullUser.isVerified,
        reviewsWritten: fullUser.reviewsWritten ? fullUser.reviewsWritten.length : 0,
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { googleCallback, logout, getMe };
