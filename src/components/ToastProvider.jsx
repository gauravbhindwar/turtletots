import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TOAST_TYPE_STYLES = {
  success: 'bg-[#128C7E] text-white',
  error: 'bg-error text-on-error',
  info: 'bg-secondary text-on-secondary'
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const type = options.type || 'success';
    const duration = Number.isFinite(options.duration) ? options.duration : 2800;

    setToasts((previous) => [...previous, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, Math.max(800, duration));
  }, []);

  const contextValue = useMemo(() => ({
    showToast,
    dismissToast
  }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="fixed top-24 right-4 z-[120] space-y-3 w-[min(92vw,360px)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl shadow-xl px-4 py-3 flex items-start gap-3 border border-white/20 ${TOAST_TYPE_STYLES[toast.type] || TOAST_TYPE_STYLES.info}`}
            role="status"
            aria-live="polite"
          >
            <span className="material-symbols-outlined text-[20px] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <p className="text-sm font-semibold leading-5 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-white/90 hover:text-white"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
};
