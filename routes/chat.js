const express = require("express");
const router = express.Router();
const { ensureAuth } = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");

// Chat page between logged-in user and another user
router.get("/:id", ensureAuth, async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.id);
    if (!otherUser) return res.status(404).send("User not found");

    // get all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.id },
        { sender: req.params.id, receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 }).populate("sender", "displayName");

    res.render("chat", {
      user: req.user,
      otherUser,
      messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
