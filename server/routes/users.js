const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getMyReviews,
  submitInsiderReport
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/profile/reviews', protect, getMyReviews);
router.post('/insider-report', protect, submitInsiderReport);

module.exports = router;