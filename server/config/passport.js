const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');
const College = require('../models/College');
const { isCollegeEmail, getDomainFromEmail } = require('../utils/emailValidator');

const googleConfigured = Boolean(process.env.JWT_SECRET && process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);
if (googleConfigured) passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (!email) {
          return done(null, false, { message: 'no_email_provided' });
        }

        // Validate college email
        if (!isCollegeEmail(email)) {
          return done(null, false, { message: 'invalid_college_email' });
        }

        // Find or create user
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            googleId: profile.id,
            email,
            name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          });
        }

        // Attempt to match college by email domain
        const domain = getDomainFromEmail(email);
        if (domain) {
          const college = await College.findOne({ emailDomains: { $in: [domain] } });
          if (college) {
            user.college = college._id;
            user.isVerified = true;
          }
        }

        await user.save();
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Minimal serialize/deserialize — JWT is primary auth, sessions not used
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = { passport, googleConfigured };
