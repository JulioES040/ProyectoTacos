'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [authenticated, loading, pathname, router]);

  if (loading || !authenticated) return <main className="auth-loading"><span /><strong>Verificando acceso</strong></main>;
  return <>{children}</>;
}
