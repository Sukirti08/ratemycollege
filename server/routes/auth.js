const express = require('express');
const { passport, googleConfigured } = require('../config/passport');
const { logout, getMe, googleCallback } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { strictLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
if (googleConfigured) {
  router.get('/google', strictLimiter, passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  router.get('/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${process.env.CLIENT_URL || ''}/?error=invalid_college_email`,
      session: false,
    }),
    googleCallback
  );
} else {
  router.get(['/google', '/google/callback'], (_req, res) => res.redirect('/?error=oauth_unavailable'));
}
router.post('/logout', logout);
router.get('/me', protect, getMe);
module.exports = router;
