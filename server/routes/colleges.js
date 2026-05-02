const express = require('express');
const router = express.Router();
const {
  getAllColleges,
  getCollegeById,
  getCollegeReviews,
  getCollegeProfessors,
  getCollegePlacements,
  getCollegeQuestions,
  getLeaderboard,
  getTrending,
  getCollegeStats
} = require('../controllers/collegeController');

router.get('/leaderboard', getLeaderboard);
router.get('/trending', getTrending);
router.get('/stats', getCollegeStats);
router.get('/', getAllColleges);
router.get('/:id', getCollegeById);
router.get('/:id/reviews', getCollegeReviews);
router.get('/:id/professors', getCollegeProfessors);
router.get('/:id/placements', getCollegePlacements);
router.get('/:id/questions', getCollegeQuestions);

module.exports = router;