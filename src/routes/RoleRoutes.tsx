import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../features/auth';
import { ADMIN_HOME, PLATFORM_ADMIN_ROLE } from '../features/admin/types';

/** Platform admin pages. Everyone else goes back to the clinic dashboard. */
export function AdminRoute() {
  const { user } = useAuth();
  if (user?.role !== PLATFORM_ADMIN_ROLE) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

/**
 * Clinic pages. Platform admins have no clinical access in the API, so they
 * are sent to the admin page instead of seeing errors.
 */
export function ClinicalRoute() {
  const { user } = useAuth();
  if (user?.role === PLATFORM_ADMIN_ROLE) {
    return <Navigate to={ADMIN_HOME} replace />;
  }
  return <Outlet />;
}
