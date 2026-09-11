const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  questionType: { type: String, enum: ["multiple-choice", "written"], default: "multiple-choice" },
  options: [{ type: String }],
  correctAnswer: { type: Number },
  correctAnswerText: { type: String },
});

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pdf: { type: mongoose.Schema.Types.ObjectId, ref: "Pdf", required: true },
  questions: [questionSchema],
  questionType: { type: String, enum: ["multiple-choice", "written", "mixed"], default: "multiple-choice" },
  score: { type: Number, default: 0 },
  answeredCount: { type: Number, default: 0 },
  totalQuestions: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  userAnswers: [{ type: mongoose.Schema.Types.Mixed }],
  writtenResults: [{ type: String, enum: ["correct", "wrong", null], default: null }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", quizSchema);
