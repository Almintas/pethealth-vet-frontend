import { Navigate, Outlet, useSearchParams } from 'react-router';
import { useAuth } from '../features/auth';
import { RouteLoading } from './RouteLoading';

/** Only same-app paths, so ?next= can't send people to another site. */
function safeNextPath(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/';
}

export function PublicRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const [searchParams] = useSearchParams();

  if (isInitializing) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;
  }

  return <Outlet />;
}
