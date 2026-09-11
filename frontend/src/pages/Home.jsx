import { useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

function Home({ login }) {
  const location = useLocation();

  const renderRightPanel = () => {
    if (location.pathname === "/login") return <Login login={login} />;
    if (location.pathname === "/register") return <Register login={login} />;
    if (location.pathname === "/forgot-password") return <ForgotPassword />;
    if (location.pathname.startsWith("/reset-password/")) return <ResetPassword />;
    return <Login login={login} />;
  };

  return (
    <div className="home">
      <div className="home-art">
        <div className="art-glow art-glow-1" aria-hidden="true" />
        <div className="art-glow art-glow-2" aria-hidden="true" />
        <div className="art-glow art-glow-3" aria-hidden="true" />

        <div className="home-art-inner">
          <div className="home-badge anim-fade-up anim-delay-1">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            Yapay Zeka Destekli Quiz
          </div>

          <h1 className="anim-fade-up anim-delay-2">
            Öğrendiklerini <em>test et.</em>
          </h1>

          <p className="home-sub anim-fade-up anim-delay-3">
            PDF dosyalarından yapay zekanın hazırladığı quizlerle bilgini ölç,
            bilgini tazele.
          </p>

          <div className="preview-card anim-fade-up anim-delay-4">
            <div className="preview-header">
              <span className="preview-dot preview-dot--green" />
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-header-label">Quiz Önizleme</span>
            </div>
            <div className="preview-body">
              <div className="preview-question">Mitokondrinin görevi nedir?</div>
              <div className="preview-options">
                <div className="preview-opt">
                  <span className="preview-opt-letter">A</span>
                  DNA depolamak
                </div>
                <div className="preview-opt preview-opt--correct">
                  <span className="preview-opt-letter">B</span>
                  Enerji üretmek
                  <svg className="preview-opt-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="preview-opt">
                  <span className="preview-opt-letter">C</span>
                  Protein sentezi
                </div>
              </div>
              <div className="preview-footer">
                <div className="preview-score">
                  <svg viewBox="0 0 36 36" className="preview-ring">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.8" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#34d399" strokeWidth="2.8" strokeDasharray="70 100" strokeLinecap="round" transform="rotate(-90 18 18)" />
                  </svg>
                  <span className="preview-pct">80%</span>
                </div>
                <span className="preview-score-label">3 / 4 doğru</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="home-auth anim-fade-up anim-delay-3">
        {renderRightPanel()}
      </div>
    </div>
  );
}

export default Home;
