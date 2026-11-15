import { Navigate } from 'react-router';
import { useAuth } from '../features/auth';
import { ADMIN_HOME, PLATFORM_ADMIN_ROLE } from '../features/admin/types';
import { RouteLoading } from './RouteLoading';

export function RootRedirect() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Navigate
      to={user?.role === PLATFORM_ADMIN_ROLE ? ADMIN_HOME : '/dashboard'}
      replace
    />
  );
}
