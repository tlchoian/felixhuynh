import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { PendingApprovalScreen } from "./PendingApprovalScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { status, loading: roleLoading } = useUserRole();
  const { t } = useLanguage();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground mt-4">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Block access for pending users
  if (status === "pending") {
    return <PendingApprovalScreen />;
  }

  // Block access for suspended users
  if (status === "suspended") {
    return <PendingApprovalScreen />;
  }

  return <>{children}</>;
}
