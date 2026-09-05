'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppRole, useAuth } from './auth-context';

export function AuthGate({ children, roles }: { children: React.ReactNode; roles?: AppRole[] }) {
  const { authenticated, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!loading && user && roles?.length && !roles.includes(user.role)) router.replace(user.role === 'KITCHEN' ? '/kitchen' : '/pos');
  }, [authenticated, loading, pathname, roles, router, user]);

  if (loading || !authenticated || (roles?.length && user && !roles.includes(user.role))) return <main className="auth-loading"><span /><strong>Verificando acceso</strong></main>;
  return <>{children}</>;
}
