import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/stores/auth';
import { PageLoader } from '@/components/PageLoader';

/** Route guard: verifies the admin session (via /auth/me) before rendering. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, user, fetchMe } = useAuth();

  useEffect(() => {
    if (status === 'idle') void fetchMe();
  }, [status, fetchMe]);

  if (status === 'idle' || status === 'loading') return <PageLoader />;
  if (status === 'unauthenticated' || !user || user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
