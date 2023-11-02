const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route to initiate Google authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback route for Google OAuth
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {

    if (req.isAuthenticated() && req.user.email_status === true && req.user.two_fa_verification === true) {
        res.render('TwoFAverification'); 
      } else if (req.isAuthenticated() && req.user.email_status === true){
        res.redirect('/dashboard');   
    }
    else {
      res.redirect('/login');
    } 

  }
);

module.exports = router;