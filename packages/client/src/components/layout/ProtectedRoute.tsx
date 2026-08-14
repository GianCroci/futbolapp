import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { AuthErrorState } from '../common/AuthErrorState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
  const accessToken = useAuthStore((s) => s.accessToken);

  if (isLoading || (isAuthenticated && !accessToken)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <AuthErrorState />;
  }

  if (!isAuthenticated) {
    // Logged-out visitors land on `/` (the public landing), never /login.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
