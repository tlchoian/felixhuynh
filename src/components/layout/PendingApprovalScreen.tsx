import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function PendingApprovalScreen() {
  const { t } = useLanguage();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-warning animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {t("pending_approval_title")}
          </h1>
          <p className="text-muted-foreground">
            {t("pending_approval_message")}
          </p>
        </div>

        <div className="pt-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            {t("btn_sign_out")}
          </Button>
        </div>
      </div>
    </div>
  );
}
