const express = require('express');
const passport = require('passport');

const router = express.Router();

// Start Google login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/profile'); // login success
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;