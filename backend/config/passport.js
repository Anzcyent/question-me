const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        if (email) {
          user = await User.findOne({ email });
          if (user && !user.googleId) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }
        }

        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: email || `${profile.id}@google.com`,
          isVerified: true,
        });
        await user.save();
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;