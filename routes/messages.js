const express = require('express');
const Message = require('../models/Message');
const router = express.Router();

// Ensure the user is logged in
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Get messages between logged-in user and another user
router.get('/:userId', ensureAuth, async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: userId },
      { sender: userId, receiver: currentUserId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'displayName image')
    .populate('receiver', 'displayName image');

  res.render('chat', { messages, currentUserId, otherUserId: userId });
});

// Send a message
router.post('/:userId', ensureAuth, async (req, res) => {
  const { userId } = req.params;
  const { text } = req.body;

  const newMessage = await Message.create({
    sender: req.user._id,
    receiver: userId,
    text,
  });

  res.redirect(`/messages/${userId}`);
});

module.exports = router;
