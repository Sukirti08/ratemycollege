const rateLimit = require('express-rate-limit');

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

const isDev = process.env.NODE_ENV !== 'production';

/**
 * General limiter: 100 requests per 15 minutes per IP.
 * Applied globally in server.js.
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict limiter: 10 requests per 15 minutes.
 * Use on auth routes to prevent brute-force.
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Oracle limiter: 20 requests per hour per IP.
 * Use on AI/Oracle endpoints to control LLM costs.
 */
const oracleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isDev ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = rateLimiter;
module.exports.strictLimiter = strictLimiter;
module.exports.oracleLimiter = oracleLimiter;
