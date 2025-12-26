import { useNavigate } from "react-router-dom";
import { ShieldX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
        <ShieldX className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">
        {t("access_denied_title")}
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("access_denied_message")}
      </p>
      <Button onClick={() => navigate("/")} className="gap-2">
        <Home className="w-4 h-4" />
        {t("access_denied_go_home")}
      </Button>
    </div>
  );
}
