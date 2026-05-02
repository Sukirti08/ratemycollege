const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — requires a valid JWT token (cookie or Authorization header).
 * Attaches the full user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check httpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fall back to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-__v')
      .populate('college', 'name shortName');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * optionalAuth — like protect but does not block unauthenticated requests.
 * Sets req.user = null when no token is present.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select('-__v')
      .populate('college', 'name shortName');

    req.user = user || null;
    next();
  } catch (error) {
    // Invalid token — treat as unauthenticated rather than erroring
    req.user = null;
    next();
  }
};

module.exports = { protect, optionalAuth };
