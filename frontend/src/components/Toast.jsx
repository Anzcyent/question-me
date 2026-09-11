import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration, createdAt: Date.now() }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (msg, duration) => addToast(msg, "info", duration),
    [addToast]
  );
  toast.success = (msg, duration) => addToast(msg, "success", duration);
  toast.error = (msg, duration) => addToast(msg, "error", duration);
  toast.warning = (msg, duration) => addToast(msg, "warning", duration);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
  const { id, message, type, duration, createdAt } = toast;
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const tick = 50;
    const interval = setInterval(() => {
      const elapsed = Date.now() - createdAt;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setExiting(true);
        setTimeout(() => onRemove(id), 300);
      }
    }, tick);
    return () => clearInterval(interval);
  }, [id, duration, createdAt, onRemove]);

  const iconMap = {
    success: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  };

  return (
    <div
      className={`toast-item toast-${type} ${exiting ? "toast-exit" : ""}`}
      onClick={() => {
        setExiting(true);
        setTimeout(() => onRemove(id), 300);
      }}
    >
      <div className="toast-icon">{iconMap[type]}</div>
      <div className="toast-body">
        <span className="toast-msg">{message}</span>
      </div>
      <div className="toast-progress-track">
        <div
          className={`toast-progress-bar toast-bar-${type}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
