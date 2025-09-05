require("dotenv").config();
const connectDB = require("./config/db");
connectDB();
const initPassport = require("./config/passport");
initPassport();

const express = require("express");
const path = require("path");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");

const app = express();
const PORT = process.env.PORT || 3000;

// Wrap Express in an HTTP server for Socket.io
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

const Message = require("./models/Message");

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "main"));

// Middleware
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "for_all")));

// Sessions (in-memory for now; dev only)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Make logged-in user available in all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);

app.get("/", (req, res) => {
  res.render("home", { user: res.locals.user });
});

app.get("/login", (req, res) => {
  if (res.locals.user) return res.redirect("/profile");
  res.render("login");
});

const User = require("./models/User");

app.get("/profile", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const users = await User.find({ _id: { $ne: req.user._id } }); // all other users
    res.render("profile", { user: req.user, users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

// ==========================
// SOCKET.IO
// ==========================
io.on("connection", (socket) => {
  console.log("A user connected");

  // join a room for each user
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
  });

  // handle sending a message
  socket.on("sendMessage", async (data) => {
    const { senderId, receiverId, text } = data;

    try {
      // save message in DB
      const message = await Message.create({ sender: senderId, receiver: receiverId, text });

      // send to receiver's room
      io.to(receiverId).emit("newMessage", { senderId, text });
      // also send to sender (so they see it instantly)
      io.to(senderId).emit("newMessage", { senderId, text });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server using HTTP wrapper
http.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
