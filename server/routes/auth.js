const express = require("express");
const router = express.Router();
const passport = require("passport");
const { logout, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { strictLimiter } = require("../middleware/rateLimiter");

router.get("/google", strictLimiter, passport.authenticate("google", { 
  scope: ["profile", "email"], 
  session: false 
}));

router.get("/google/callback", 
  passport.authenticate("google", { 
    failureRedirect: `${process.env.CLIENT_URL}/?error=invalid_college_email`, 
    session: false 
  }), 
  (req, res) => { 
    const { generateToken, setTokenCookie } = require("../utils/jwtHelper"); 
    const token = generateToken(req.user._id); 
    setTokenCookie(res, token); 
    res.redirect(`${process.env.CLIENT_URL}/profile`); 
  }
);

router.post("/logout", logout);
router.get("/me", protect, getMe);

module.exports = router;