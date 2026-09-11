import { useEffect, useState } from "react";

const steps = {
  uploading: [
    "PDF dosyası okunuyor...",
    "Sunucuya yükleniyor...",
    "İçerik analiz ediliyor...",
  ],
  generating: [
    "Yapay zeka düşünüyor...",
    "Sorular oluşturuluyor...",
    "Seçenekler hazırlanıyor...",
    "Quiz son halini alıyor...",
  ],
  submitting: [
    "Cevaplar kontrol ediliyor...",
    "Yazılı cevaplar değerlendiriliyor...",
    "Sonuçlar hazırlanıyor...",
  ],
  deleting: [
    "Siliniyor...",
    "Temizleniyor...",
  ],
};

function LoadingOverlay({ type, progress }) {
  const [stepIndex, setStepIndex] = useState(0);
  const messages = steps[type] || steps.deleting;

  useEffect(() => {
    setStepIndex(0);
    if (type === "generating") {
      const interval = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, messages.length - 1));
      }, 2500);
      return () => clearInterval(interval);
    }
    if (type === "uploading") {
      const interval = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, messages.length - 1));
      }, 1500);
      return () => clearInterval(interval);
    }
    if (type === "submitting") {
      const interval = setInterval(() => {
        setStepIndex((prev) => Math.min(prev + 1, messages.length - 1));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [type]);

  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-icon-ring">
          <div className="loading-spinner-lg" />
          <div className="loading-icon-inner">
            {type === "uploading" && (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            )}
        {(type === "generating" || type === "submitting") && (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            )}
            {type === "submitting" && (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#5eead4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            )}
            {type === "deleting" && (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            )}
          </div>
        </div>

        <p className="loading-step">{messages[stepIndex]}</p>

        {type === "uploading" && typeof progress === "number" && (
          <div className="loading-bar-wrap">
            <div className="loading-bar">
              <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="loading-pct">%{progress}</span>
          </div>
        )}

        {type === "generating" && (
          <div className="loading-dots">
            <span /><span /><span />
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingOverlay;
