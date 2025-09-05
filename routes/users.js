const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Ensure the user is logged in
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// List all other users
router.get('/', ensureAuth, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } });
  res.render('users', { users, currentUser: req.user });
});

module.exports = router;
