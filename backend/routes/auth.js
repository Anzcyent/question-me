const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("../config/passport");
const User = require("../models/User");
const { sendVerificationEmail, sendResetPasswordEmail } = require("../utils/email");

const router = express.Router();

async function sendVerification(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.verificationToken = token;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 3600 * 1000);
  await user.save();
  try {
    await sendVerificationEmail(user, token);
    return true;
  } catch (error) {
    console.error("Doğrulama maili gönderilemedi:", error.message);
    return false;
  }
}

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const user = JSON.stringify({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    });
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(user)}`
    );
  }
);

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/;

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!PASSWORD_RULE.test(password || "")) {
      return res
        .status(400)
        .json({
          message:
            "Şifre en az 8 karakter olmalı; en az bir büyük harf, bir küçük harf ve bir noktalama işareti içermelidir.",
        });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Bu email ile zaten kayıtlı bir hesap var. Lütfen giriş yapın.",
      });
    }
    const user = new User({ name, email, password, isVerified: false });
    await user.save();
    const sent = await sendVerification(user);
    res.status(201).json({
      message: sent
        ? "Doğrulama maili gönderildi. Lütfen email adresini doğrula."
        : "Kayıt tamamlandı ama doğrulama maili gönderilemedi. SMTP ayarlarını kontrol edin, sonra tekrar deneyin.",
      email,
      mailSent: sent,
    });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

router.post("/verify", async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Geçersiz veya süresi dolmuş doğrulama linki" });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.json({ message: "Email başarıyla doğrulandı" });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

router.post("/resend", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    if (user.isVerified) {
      return res.json({ message: "Email zaten doğrulanmış" });
    }
    const sent = await sendVerification(user);
    if (!sent) {
      return res.status(500).json({ message: "Mail gönderilemedi. SMTP ayarlarını kontrol et." });
    }
    res.json({ message: "Doğrulama maili yeniden gönderildi" });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Geçersiz email veya şifre" });
    }
    if (!user.password) {
      return res.status(400).json({
        message: "Bu hesap Google ile oluşturulmuş. Lütfen Google ile giriş yapın.",
      });
    }
    if (!user.isVerified && user.verificationToken) {
      return res.status(403).json({
        message: "Email adresin doğrulanmadı. Lütfen mail kutunu kontrol et.",
        email,
      });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Geçersiz email veya şifre" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: user._id, name: user.name, email },
    });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email adresi gerekli" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama maili gönderildi." });
    }
    if (!user.password) {
      return res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama maili gönderildi." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 3600 * 1000);
    await user.save();
    try {
      await sendResetPasswordEmail(user, token);
    } catch (error) {
      console.error("Şifre sıfırlama maili gönderilemedi:", error.message);
    }
    res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama maili gönderildi." });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token ve şifre gerekli" });
    }
    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        message:
          "Şifre en az 8 karakter olmalı; en az bir büyük harf, bir küçük harf ve bir noktalama işareti içermelidir.",
      });
    }
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Geçersiz veya süresi dolmuş sıfırlama linki" });
    }
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    res.json({ message: "Şifreniz başarıyla sıfırlandı. Artık giriş yapabilirsiniz." });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

module.exports = router;
