const express = require('express');
const router = express.Router();
const {
  getProfessorById,
  submitProfessorReview,
  getTopProfessors
} = require('../controllers/professorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/top', getTopProfessors);
router.get('/:id', getProfessorById);
router.post('/:id/reviews', protect, submitProfessorReview);

module.exports = router;