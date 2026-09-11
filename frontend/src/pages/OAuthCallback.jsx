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
    <div className="auth-container" style={{ textAlign: "center" }}>
      <h2>Google ile giriş başarılı!</h2>
      <p style={{ color: "#888" }}>Yönlendiriliyorsunuz...</p>
    </div>
  );
}

export default OAuthCallback;