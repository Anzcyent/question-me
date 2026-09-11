import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GoogleButton from "../components/GoogleButton";

function Login({ login }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "google_failed") {
      setError("Google girişi başarısız oldu. Lütfen tekrar deneyin.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnverifiedEmail("");
    setResendMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        if (res.status === 403 && data.email) {
          setUnverifiedEmail(data.email);
        }
      } else {
        login(data.token, data.user, remember);
      }
    } catch (err) {
      setError("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (target) => {
    setResendLoading(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const data = await res.json();
      setResendMsg(res.ok ? data.message : data.message);
    } catch {
      setResendMsg("Sunucu hatası");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Giriş Yap</h2>
      {error && <div className="error-message">{error}</div>}
      {unverifiedEmail && (
        <div className="error-message" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ flex: "1 1 auto" }}>Doğrulama mailini yeniden gönderebilirsin.</span>
          <button
            onClick={() => handleResend(unverifiedEmail)}
            className="btn btn-blue"
            disabled={resendLoading}
          >
            {resendLoading ? "Gönderiliyor..." : "Yeniden gönder"}
          </button>
        </div>
      )}
      {resendMsg && <div className="success-message">{resendMsg}</div>}
      <GoogleButton />
      <div className="divider">veya email ile</div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <div className="input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Şifre</label>
          <div className="input-wrap">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="remember-row">
          <label className="remember-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="checkmark" />
            <span className="remember-text">Beni hatırla</span>
          </label>
          <Link to="/forgot-password" className="forgot-link">Şifremi Unuttum?</Link>
        </div>
        <button className="btn btn-blue btn-full" type="submit" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
      <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
        Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
      </p>
    </div>
  );
}

export default Login;
