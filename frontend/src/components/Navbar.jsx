import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function Navbar({ token, user, logout, isLanding }) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (confirmLogout && !e.target.closest(".modal-card")) {
        setConfirmLogout(false);
      }
    };
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, [confirmLogout]);

  return (
    <>
    <nav className={`navbar ${isLanding ? "navbar--landing anim-fade-down" : ""}`}>
      <Link to="/" className={`brand ${isLanding ? "brand--light" : ""}`}>
        <span className="brand-mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </span>
        <span className="brand-text">Question Me</span>
      </Link>

      <div className="navbar-right">
        {token ? (
          <div className="profile" ref={menuRef}>
            <button
              className={`profile-trigger ${open ? "active" : ""}`}
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={open}
            >
              <svg className="profile-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="profile-name">{user?.name}</span>
              <svg
                className="profile-caret"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {open && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <svg className="profile-menu-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <div>
                    <p className="profile-menu-name">{user?.name}</p>
                    <p className="profile-menu-email">{user?.email}</p>
                  </div>
                </div>
                <Link to="/" className="profile-menu-item" onClick={() => setOpen(false)}>
                  Ana Sayfa
                </Link>
                <Link to="/my-quizzes" className="profile-menu-item" onClick={() => setOpen(false)}>
                  Quizlerim
                </Link>
                <button
                  className="profile-menu-item danger"
                  onClick={() => {
                    setOpen(false);
                    setConfirmLogout(true);
                  }}
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar-links navbar-links--light">
            <Link to="/register" className="navbar-cta-link">
              Hesabın yok mu? <strong>Kayıt Ol</strong>
            </Link>
          </div>
        )}
      </div>
    </nav>

    {confirmLogout && (
      <div className="modal-overlay">
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">Çıkış Yap</h3>
          <p className="modal-desc">Hesabından çıkış yapmak istediğine emin misin?</p>
          <div className="modal-actions">
            <button className="modal-btn modal-btn-cancel" onClick={() => setConfirmLogout(false)}>
              İptal
            </button>
            <button className="modal-btn modal-btn-danger" onClick={() => { setConfirmLogout(false); logout(); }}>
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Navbar;
