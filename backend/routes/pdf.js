const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const auth = require("../middleware/auth");
const Pdf = require("../models/Pdf");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, "latin1").toString("utf8");
    cb(null, Date.now() + "-" + originalName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Sadece PDF dosyaları yüklenebilir."));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/upload", auth, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Lütfen bir PDF dosyası seçin." });
    }

    const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");

    const existingPdf = await Pdf.findOne({ user: req.user.userId, originalName });
    if (existingPdf) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({ message: `"${originalName}" adında bir PDF zaten mevcut.` });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);

    const pdf = new Pdf({
      user: req.user.userId,
      filename: req.file.filename,
      originalName: originalName,
      text: data.text,
    });
    await pdf.save();

    res.status(201).json({
      message: "PDF yüklendi.",
      pdf: { id: pdf._id, originalName: pdf.originalName, text: data.text.substring(0, 500) + "..." },
    });
  } catch (error) {
    res.status(500).json({ message: "PDF işlenemedi. Lütfen tekrar deneyin." });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const pdfs = await Pdf.find({ user: req.user.userId }).select("-text").sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: "PDF listesi yüklenemedi." });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ _id: req.params.id, user: req.user.userId });
    if (!pdf) {
      return res.status(404).json({ message: "PDF bulunamadı." });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: "PDF yüklenemedi." });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const pdf = await Pdf.findOne({ _id: req.params.id, user: req.user.userId });
    if (!pdf) {
      return res.status(404).json({ message: "PDF bulunamadı." });
    }

    const Quiz = require("../models/Quiz");
    await Quiz.deleteMany({ pdf: pdf._id });

    const filePath = "uploads/" + pdf.filename;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Pdf.findByIdAndDelete(pdf._id);

    res.json({ message: "PDF silindi." });
  } catch (error) {
    res.status(500).json({ message: "Silme başarısız oldu." });
  }
});

module.exports = router;
