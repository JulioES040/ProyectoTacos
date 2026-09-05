'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppRole = 'CASHIER' | 'KITCHEN';
export type AuthUser = { sub: string; username: string; role: AppRole };
type AuthContextValue = { user: AuthUser | null; authenticated: boolean; loading: boolean; refresh: () => Promise<AuthUser | null>; logout: () => Promise<void>; loginDemo: (username: string, password: string) => AuthUser | null };
const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'demo_session';

// ─── Credenciales de demo (sin backend) ───────────────────────────────────────
const DEMO_USERS: { username: string; password: string; role: AppRole }[] = [
  { username: 'cajero',  password: 'admin123', role: 'CASHIER' },
  { username: 'cocina',  password: 'admin123', role: 'KITCHEN' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loginDemo = (username: string, password: string): AuthUser | null => {
    const found = DEMO_USERS.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password,
    );
    if (!found) return null;
    const session: AuthUser = { sub: found.username, username: found.username, role: found.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  const refresh = async (): Promise<AuthUser | null> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AuthUser = JSON.parse(stored) as AuthUser;
        setUser(session);
        return session;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const value = useMemo(() => ({
    user,
    authenticated: Boolean(user),
    loading,
    refresh,
    loginDemo,
    logout: async () => {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
