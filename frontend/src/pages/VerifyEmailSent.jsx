import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE } from "../api";

function VerifyEmailSent() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const mailSent = searchParams.get("sent") !== "0";
  const [resendMsg, setResendMsg] = useState("");
  const [resendError, setResendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    setLoading(true);
    setResendMsg("");
    setResendError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendError(data.message);
      } else {
        setResendMsg(data.message);
        setCountdown(60);
      }
    } catch {
      setResendError("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-aura" aria-hidden="true" />

      <div className="verify-card">
        <div className="verify-icon-wrap">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <h2 className="verify-title">Email Doğrulama</h2>

        {mailSent ? (
          <>
            <div className="verify-email-badge">
              {email || "email adresiniz"}
            </div>
            <p className="verify-desc">
              Mailindeki <strong>"Emailimi Doğrula"</strong> butonuna tıklayarak hesabını aktifleştirebilirsin.
              Maili görmediysen spam klasörünü kontrol et.
            </p>
          </>
        ) : (
          <p className="verify-desc">
            Kayıt tamamlandı ama doğrulama maili gönderilemedi. Sistemin mail (SMTP) ayarları
            eksik. Sistem yöneticisiyle iletişime geçmen gerekiyor.
          </p>
        )}

        {resendError && (
          <div className="verify-msg verify-msg-error">{resendError}</div>
        )}
        {resendMsg && (
          <div className="verify-msg verify-msg-success">{resendMsg}</div>
        )}

        {mailSent && (
          <button
            onClick={handleResend}
            className="verify-btn-primary"
            disabled={loading || countdown > 0}
          >
            {countdown > 0
              ? `${countdown} sn sonra tekrar deneyebilirsin`
              : loading
              ? "Gönderiliyor..."
              : "Doğrulama mailini yeniden gönder"}
          </button>
        )}

        <p className="verify-footer">
          Zaten doğruladın mı? <Link to="/login">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailSent;
