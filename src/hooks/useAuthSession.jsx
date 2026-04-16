import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import useCartStore from '../store/cartStore';
import useFavoritesStore from '../store/favoritesStore';

const AuthSessionContext = createContext(null);

const PROFILE_COLUMNS = 'id, email, full_name, phone, address, role';

const ROLE_PRIORITY = {
  admin: 3,
  manager: 2,
  user: 1
};

const LOADING_SAFETY_MS = 10000;
const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;
const PROFILE_CACHE_STORAGE_KEY = 'turtletots-profile-cache';
const profileCache = new Map();

const canUseSessionStorage = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const readProfileStorage = () => {
  if (!canUseSessionStorage()) return {};

  try {
    const raw = window.sessionStorage.getItem(PROFILE_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const writeProfileStorage = (payload) => {
  if (!canUseSessionStorage()) return;

  try {
    window.sessionStorage.setItem(PROFILE_CACHE_STORAGE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Ignore storage write errors.
  }
};

const clearAllCachedProfiles = () => {
  profileCache.clear();

  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PROFILE_CACHE_STORAGE_KEY);
};

const clearClientStores = () => {
  useCartStore.getState().clearCart();
  useFavoritesStore.getState().clearFavorites();

  if (useFavoritesStore.persist?.clearStorage) {
    useFavoritesStore.persist.clearStorage();
    return;
  }

  if (canUseSessionStorage()) {
    window.sessionStorage.removeItem('turtletots-favorites-session');
  }
};

const getCachedProfile = (userId) => {
  const entry = profileCache.get(userId);

  if (!entry) {
    const storedProfiles = readProfileStorage();
    const persistedEntry = storedProfiles[userId];

    if (!persistedEntry) {
      return null;
    }

    if (persistedEntry.expiresAt < Date.now()) {
      delete storedProfiles[userId];
      writeProfileStorage(storedProfiles);
      return null;
    }

    profileCache.set(userId, persistedEntry);
    return persistedEntry.profile;
  }

  if (entry.expiresAt < Date.now()) {
    profileCache.delete(userId);
    return null;
  }

  return entry.profile;
};

const setCachedProfile = (profile) => {
  if (!profile?.id) return;

  const cacheEntry = {
    profile,
    expiresAt: Date.now() + PROFILE_CACHE_TTL_MS
  };

  profileCache.set(profile.id, cacheEntry);

  const storedProfiles = readProfileStorage();
  storedProfiles[profile.id] = cacheEntry;
  writeProfileStorage(storedProfiles);
};

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

const fetchProfile = async (user, { bypassCache = false } = {}) => {
  if (!bypassCache) {
    const cached = getCachedProfile(user.id);
    if (cached) {
      return cached;
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    setCachedProfile(data);
    return data;
  }

  const fallbackProfile = await upsertFallbackProfile(user);
  setCachedProfile(fallbackProfile);
  return fallbackProfile;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const resetAuthState = ({ clearProfileCache = true, clearStores = false } = {}) => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);

    if (clearProfileCache) {
      clearAllCachedProfiles();
    }

    if (clearStores) {
      clearClientStores();
    }
  };

  const hydrateSession = async (nextSession) => {
    setSession(nextSession || null);

    if (!nextSession?.user) {
      resetAuthState();
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
          setCachedProfile(updatedProfile);
          setProfile(updatedProfile);
          setLoading(false);
          return;
        }
      }

      setProfile({
        ...storedProfile,
        role: resolvedRole
      });
      setCachedProfile({
        ...storedProfile,
        role: resolvedRole
      });
    } catch (error) {
      const fallback = createFallbackProfile(activeUser);
      setProfile(fallback);
      setCachedProfile(fallback);
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
          await supabase.auth.signOut({ scope: 'local' });
        }

        if (isMounted) {
          await hydrateSession(data?.session || null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Session bootstrap failed:', error.message);
        await supabase.auth.signOut({ scope: 'local' });
        resetAuthState();
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
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isMounted) return;

      if (event === 'TOKEN_REFRESHED') {
        // Avoid flashing global loaders on silent token refresh cycles.
        setSession(nextSession || null);
        setUser(nextSession?.user || null);
        if (!nextSession?.user) {
          setProfile(null);
          clearAllCachedProfiles();
        }
        return;
      }

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
          await supabase.auth.signOut({ scope: 'local' });
          resetAuthState();
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
    if (!user?.id) return null;

    try {
      const data = await fetchProfile(user, { bypassCache: true });
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Unable to refresh profile:', error.message);
      return null;
    }
  };

  const signOut = async () => {
    try {
      const signOutPromise = supabase.auth.signOut({ scope: 'local' });

      // Clear local auth state immediately so route guards react without waiting.
      resetAuthState({ clearStores: true });

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
