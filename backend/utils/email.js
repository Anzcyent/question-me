const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(user, token) {
  const link = `${process.env.APP_URL}/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Question Me - Email Doğrulama",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0e9196;">Question Me</h2>
        <p>Merhaba ${user.name},</p>
        <p>Hesabını doğrulamak için aşağıdaki butona tıkla:</p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#12b0b4;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block;font-weight:bold;">
            Emailimi Doğrula
          </a>
        </p>
        <p>Buton çalışmıyorsa şu bağlantıyı kullan:</p>
        <p style="word-break:break-all;"><a href="${link}" style="color:#0e9196;">${link}</a></p>
        <p style="color:#777;font-size:12px;">Bu link 24 saat geçerlidir.</p>
      </div>
    `,
  });
}

async function sendResetPasswordEmail(user, token) {
  const link = `${process.env.APP_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Question Me - Şifre Sıfırlama",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#0d9488;">Question Me</h2>
        <p>Merhaba ${user.name},</p>
        <p>Şifreni sıfırlamak için aşağıdaki butona tıkla:</p>
        <p style="margin:24px 0;">
          <a href="${link}" style="background:#0d9488;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block;font-weight:bold;">
            Şifremi Sıfırla
          </a>
        </p>
        <p>Buton çalışmıyorsa şu bağlantıyı kullan:</p>
        <p style="word-break:break-all;"><a href="${link}" style="color:#0d9488;">${link}</a></p>
        <p style="color:#777;font-size:12px;">Bu link 1 saat geçerlidir. Eğer bu isteği sen yapmadıysan, bu maili görmezden gelebilirsin.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };