import { Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLanguage } from "@/contexts/LanguageContext";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { logoUrl } = useAppSettings();
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-foreground"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Shield className="w-5 h-5 text-primary" />
          )}
        </div>
        <span className="font-semibold text-foreground text-sm">{t("app_name")}</span>
      </div>
      
      <div className="w-10" /> {/* Spacer for balance */}
    </header>
  );
}
