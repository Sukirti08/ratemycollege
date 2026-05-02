const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/oracleController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { oracleLimiter } = require('../middleware/rateLimiter');

router.post('/chat', optionalAuth, oracleLimiter, chat);

module.exports = router;