import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        setMessage(data.message);
        setStatus(res.ok ? "success" : "error");
      } catch {
        setMessage("Sunucu hatası");
        setStatus("error");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="verify-page">
      <div className="verify-aura" aria-hidden="true" />

      <div className="verify-card">
        {status === "loading" && (
          <>
            <div className="verify-icon-wrap">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2 className="verify-title">Email Doğrulanıyor</h2>
            <p className="verify-desc">Hesabınız doğrulanıyor, lütfen bekleyin...</p>
            <div className="verify-loading-dots">
              <span /><span /><span />
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-icon-wrap verify-icon-success">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="verify-title">Email Doğrulandı!</h2>
            <p className="verify-desc">{message || "Hesabınız başarıyla doğrulandı."}</p>
            <Link to="/login" className="verify-btn-primary">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Giriş Yap
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon-wrap verify-icon-error">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="verify-title">Doğrulama Başarısız</h2>
            <p className="verify-desc">{message || "Doğrulama sırasında bir hata oluştu."}</p>
            <Link to="/login" className="verify-btn-secondary">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Giriş sayfasına dön
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
