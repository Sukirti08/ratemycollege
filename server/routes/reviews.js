const express = require('express');
const router = express.Router();
const {
  submitReview,
  toggleHelpfulVote,
  flagReview,
  deleteReview,
  addQuestion,
  answerQuestion
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitReview);
router.put('/:id/helpful', protect, toggleHelpfulVote);
router.put('/:id/flag', protect, flagReview);
router.delete('/:id', protect, deleteReview);
router.post('/question', protect, addQuestion);
router.post('/question/:questionId/answer', protect, answerQuestion);

module.exports = router;