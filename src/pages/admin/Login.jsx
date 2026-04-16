import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getNextPath = () => {
    const params = new URLSearchParams(location.search);
    const requestedPath = params.get('next');

    if (requestedPath && requestedPath.startsWith('/')) {
      return requestedPath;
    }

    return '';
  };

  const canNavigateToPath = (targetPath, resolvedRole) => {
    if (!targetPath) return false;

    if (targetPath.startsWith('/admin')) {
      return resolvedRole === 'admin' || resolvedRole === 'manager';
    }

    if (targetPath.startsWith('/profile')) {
      return true;
    }

    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Attempt login using actual Supabase client
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      let resolvedRole = (data?.user?.app_metadata?.role || 'user').toLowerCase();

      const nextPath = getNextPath();
      if (nextPath && canNavigateToPath(nextPath, resolvedRole)) {
        navigate(nextPath, { replace: true });
        return;
      }

      if (nextPath && nextPath.startsWith('/admin')) {
        navigate('/404', { replace: true });
        return;
      }

      if (resolvedRole === 'admin' || resolvedRole === 'manager') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }

      setLoading(false);
    }
  };

  return (
    <div className="bg-surface selection:bg-primary-container selection:text-on-primary-container min-h-screen flex flex-col relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 -z-10 bg-surface opacity-40" 
           style={{ backgroundImage: 'radial-gradient(#fad538 1.5px, transparent 1.5px), radial-gradient(#bcd2ff 1.5px, #f5f6f7 1.5px)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }}></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl"></div>
      
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md relative">
          
          <div className="bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-xl shadow-primary/5 relative z-10 border border-outline-variant/10">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 bg-primary-container rounded-xl flex items-center justify-center mb-6 shadow-inner">
                <span className="material-symbols-outlined text-on-primary-container text-5xl" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
              </div>
              <h1 className="plusJakartaSans text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
                Welcome Back
              </h1>
              <p className="inter text-on-surface-variant mt-2 font-medium">
                Sign in to manage your profile, orders, or store operations.
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-bold text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="inter text-sm font-bold text-on-surface ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">alternate_email</span>
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all inter placeholder:text-outline-variant font-medium outline-none" 
                    placeholder="manager@toybox.joy" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="inter text-sm font-bold text-on-surface">Password</label>
                  <span className="inter text-xs font-bold text-secondary hover:text-on-secondary-container transition-colors cursor-pointer">Forgot Password?</span>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all inter placeholder:text-outline-variant font-medium outline-none" 
                    placeholder="••••••••" />
                </div>
              </div>

              <div className="flex items-center space-x-2 px-1">
                <input id="remember" type="checkbox" className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary-container bg-surface-container-low" />
                <label htmlFor="remember" className="inter text-sm font-semibold text-on-surface-variant cursor-pointer">Keep me logged in</label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary-container hover:bg-primary-fixed-dim text-on-primary-fixed font-extrabold rounded-full transition-all shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 plusJakartaSans group">
                {loading ? 'Authenticating...' : 'Sign Into Dashboard'}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-surface-variant/50 text-center">
              <p className="inter text-sm text-on-surface-variant">
                Need assistance? <span className="text-tertiary font-bold hover:underline cursor-pointer">Contact Support</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-8 w-full flex flex-col items-center gap-2 px-6">
        <p className="inter text-xs font-medium text-slate-500 text-center">
          © 2024 TurtleTots Management System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default Login;
