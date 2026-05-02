const express = require('express');
const router = express.Router();
const {
  getTrends,
  getRoastCard,
  getWeeklyInsight
} = require('../controllers/trendController');

router.get('/', getTrends);
router.get('/roast/:collegeId', getRoastCard);
router.get('/weekly-insight', getWeeklyInsight);

module.exports = router;