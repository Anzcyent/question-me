import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setMessage(data.message);
        setSent(true);
      }
    } catch {
      setError("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ textAlign: "center" }}>
      <h2>Şifremi Unuttum</h2>
      {sent ? (
        <>
          <div className="success-message">{message}</div>
          <p style={{ marginTop: "1rem", color: "var(--gray)", fontSize: "0.9rem" }}>
            Email adresini kontrol et. Şifre sıfırlama linki gönderdik.
          </p>
          <p style={{ marginTop: "1.25rem" }}>
            <Link to="/login">Giriş sayfasına dön</Link>
          </p>
        </>
      ) : (
        <>
          <p style={{ color: "var(--gray)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Email adresini gir, sana şifre sıfırlama linki gönderelim.
          </p>
          {error && <div className="error-message">{error}</div>}
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
            <button className="btn btn-blue btn-full" type="submit" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link to="/login">Giriş sayfasına dön</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default ForgotPassword;
