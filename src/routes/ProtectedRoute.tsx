import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../features/auth';
import { PendingApprovalPage } from '../features/auth/pages/PendingApprovalPage';
import { RouteLoading } from './RouteLoading';

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // The API refuses clinical operations until PetHealth approves the account.
  if (user && user.approvalStatus !== 'APPROVED') {
    return <PendingApprovalPage />;
  }

  return <Outlet />;
}
