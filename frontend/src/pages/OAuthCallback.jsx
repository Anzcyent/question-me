import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function OAuthCallback({ login }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get("token");
    const userStr = searchParams.get("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(token, user);
      } catch {
        navigate("/login?error=google_failed");
        return;
      }
    } else {
      navigate("/login?error=google_failed");
      return;
    }

    setTimeout(() => navigate("/"), 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="verify-page">
      <div className="verify-aura" aria-hidden="true" />

      <div className="verify-card">
        <div className="verify-icon-wrap verify-icon-success">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h2 className="verify-title">Giriş Başarılı!</h2>
        <p className="verify-desc">Hesabınıza başarıyla giriş yapıldı. Yönlendiriliyorsunuz...</p>
        <div className="verify-loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

export default OAuthCallback;