const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

function initPassport() {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) return done(null, existingUser);

        // If not, create a new user
        const newUser = await User.create({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0]?.value,
          image: profile.photos[0]?.value,
        });
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}

module.exports = initPassport;
