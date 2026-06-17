import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  role: "ADMIN" | "USER";
  children: ReactNode;
}

/**
 * Route guard — redirects to /auth if not logged in, or if logged in with the wrong
 * role (e.g. an operator hitting an /admin/* route). Without this, every page was
 * reachable by directly typing the URL regardless of auth state.
 */
const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (user?.role !== role) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
