
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Replace with your User model
const jwt = require('jsonwebtoken');
// Local strategy (existing)

passport.use(
  'user',
  new passportLocal(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID: '1090353028229-4p3khtl7u3hikg80pj4k3cf11otcrjhi.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: process.env.URL+'/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          return done(null, existingUser);
        }

        const newUser = new User({
          Fname: profile.name.givenName,
          Lname: profile.name.familyName,
          email: profile.emails[0].value,
          googleId: profile.id,
          role: 'User',
          status: true,
          email_status: profile.emails[0].verified,
          referralCode: generateRandomCode(7),
          referred_by: null,
          token_balance: 0,
        });

        if (newUser) {
          const token = jwt.sign({ userId: newUser._id }, 'Jasmin', {
            expiresIn: '24h',
          });
          newUser.token = token;
          await newUser.save();
          done(null, newUser);
        }

      } catch (error) {
        done(error);
      }
    }
  )
);



const crypto = require('crypto');
function generateRandomCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
}
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});


module.exports = passport;
