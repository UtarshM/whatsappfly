import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import type { UserAccessRole } from "@/lib/api";

interface ProtectedRouteProps {
  allowedRoles?: UserAccessRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isHydrating, currentRole } = useAppContext();
  const location = useLocation();

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-card">
          Loading workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
