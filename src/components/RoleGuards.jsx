import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSession } from '../hooks/useAuthSession';

const FullPageLoader = ({ message }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="px-6 py-4 rounded-full bg-surface-container-low text-sm font-bold text-on-surface-variant">
        {message}
      </div>
    </div>
  );
};

const useLoadingTimeout = (loading, timeoutMs = 4000) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [loading, timeoutMs]);

  return timedOut;
};

export const RequireAuth = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, loading } = useAuthSession();
  const location = useLocation();
  const timedOut = useLoadingTimeout(loading);

  if (loading && !timedOut) {
    return <FullPageLoader message="Checking access..." />;
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${redirectTo}?next=${next}`} replace />;
  }

  return children;
};

export const RequireRole = ({ children, allowedRoles = [], redirectTo = '/404' }) => {
  const { isAuthenticated, loading, role } = useAuthSession();
  const location = useLocation();
  const timedOut = useLoadingTimeout(loading);

  if (loading && !timedOut) {
    return <FullPageLoader message="Checking role permissions..." />;
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};
