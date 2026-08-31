'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type AuthContextValue = { authenticated: boolean; loading: boolean; refresh: () => Promise<boolean>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { await api('/auth/session'); setAuthenticated(true); return true; }
    catch { setAuthenticated(false); return false; }
    finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const value = useMemo(() => ({
    authenticated,
    loading,
    refresh,
    logout: async () => { await api('/auth/logout', { method: 'POST' }); setAuthenticated(false); },
  }), [authenticated, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
