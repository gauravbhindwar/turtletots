import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthSessionContext = createContext(null);

const PROFILE_COLUMNS = 'id, email, full_name, phone, address, role';

const ROLE_PRIORITY = {
  admin: 3,
  manager: 2,
  user: 1
};

const LOADING_SAFETY_MS = 10000;

const normalizeRole = (value) => {
  if (!value) return 'user';
  const lowered = String(value).toLowerCase();
  return ROLE_PRIORITY[lowered] ? lowered : 'user';
};

const mergeRoles = (profileRole, appMetadataRole) => {
  const normalizedProfile = normalizeRole(profileRole);
  const normalizedAppMeta = normalizeRole(appMetadataRole);

  if (ROLE_PRIORITY[normalizedAppMeta] > ROLE_PRIORITY[normalizedProfile]) {
    return normalizedAppMeta;
  }

  return normalizedProfile;
};

const createFallbackProfile = (user) => ({
  id: user.id,
  email: user.email || '',
  full_name: user.user_metadata?.full_name || '',
  phone: user.phone || '',
  address: '',
  role: normalizeRole(user.app_metadata?.role)
});

const upsertFallbackProfile = async (user) => {
  const fallback = createFallbackProfile(user);

  const { data, error } = await supabase
    .from('profiles')
    .upsert([fallback], { onConflict: 'id' })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const fetchProfile = async (user) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  return upsertFallbackProfile(user);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateSession = async (nextSession) => {
    setSession(nextSession || null);

    if (!nextSession?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const activeUser = nextSession.user;
    setUser(activeUser);

    try {
      const storedProfile = await fetchProfile(activeUser);
      const resolvedRole = mergeRoles(storedProfile.role, activeUser.app_metadata?.role);

      if (resolvedRole !== storedProfile.role) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: resolvedRole })
          .eq('id', activeUser.id)
          .select(PROFILE_COLUMNS)
          .single();

        if (!updateError && updatedProfile) {
          setProfile(updatedProfile);
          setLoading(false);
          return;
        }
      }

      setProfile({
        ...storedProfile,
        role: resolvedRole
      });
    } catch (error) {
      setProfile(createFallbackProfile(activeUser));
      console.error('Unable to load profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const safetyTimer = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
        }
      }, LOADING_SAFETY_MS);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Unable to read auth session:', error.message);
        }

        if (isMounted) {
          await hydrateSession(data?.session || null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Session bootstrap failed:', error.message);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isMounted) return;
      setLoading(true);

      const safetyTimer = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
        }
      }, LOADING_SAFETY_MS);

      try {
        await hydrateSession(nextSession || null);
      } catch (error) {
        console.error('Auth state hydration failed:', error.message);
        if (!nextSession?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Unable to refresh profile:', error.message);
      return;
    }

    setProfile(data);
  };

  const signOut = async () => {
    try {
      const signOutPromise = supabase.auth.signOut({ scope: 'local' });

      // Clear local auth state immediately so route guards react without waiting.
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);

      const { error } = await signOutPromise;

      if (error) {
        console.error('Sign out warning:', error.message);
      }
    } catch (error) {
      console.error('Sign out fallback used:', error.message);
    }
  };

  const value = useMemo(() => {
    const role = normalizeRole(profile?.role || user?.app_metadata?.role || 'user');

    return {
      session,
      user,
      profile,
      role,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: role === 'admin',
      isManager: role === 'manager',
      isUser: role === 'user',
      refreshProfile,
      signOut
    };
  }, [session, user, profile, loading]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
};

export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthProvider.');
  }

  return context;
};
