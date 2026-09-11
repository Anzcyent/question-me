const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const passport = require("./config/passport");

const authRoutes = require("./routes/auth");
const pdfRoutes = require("./routes/pdf");
const quizRoutes = require("./routes/quiz");

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
]
  .filter(Boolean)
  .map((o) => {
    try { return new URL(o).origin; } catch { return o; }
  });

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/quiz", quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
