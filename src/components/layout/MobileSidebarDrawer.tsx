import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  Network,
  ClipboardList,
  BookOpen,
  ChevronRight,
  LogOut,
  User,
  Globe,
  History,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserPermissions, ModuleKey } from "@/hooks/useUserPermissions";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  module?: ModuleKey;
};

export function MobileSidebarDrawer({ open, onOpenChange }: MobileSidebarDrawerProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = useUserRole();
  const { hasAccess } = useUserPermissions();
  const { logoUrl } = useAppSettings();

  const allNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: t("nav_dashboard"), path: "/" },
    { icon: KeyRound, label: t("nav_vault"), path: "/credentials", module: "credentials" },
    { icon: FileText, label: t("nav_contracts"), path: "/contracts", module: "contracts" },
    { icon: Network, label: t("nav_network"), path: "/network", module: "network" },
    { icon: ClipboardList, label: t("nav_tasks"), path: "/tasks", module: "tasks" },
    { icon: BookOpen, label: t("nav_wiki"), path: "/wiki", module: "wiki" },
    { icon: History, label: t("nav_activity_logs"), path: "/activity-logs" },
    { icon: Settings, label: t("nav_settings"), path: "/settings" },
  ];

  // Filter nav items based on permissions
  const navItems = allNavItems.filter((item) => {
    if (!item.module) return true;
    return isAdmin || hasAccess(item.module);
  });

  // Add admin-only item
  if (isAdmin) {
    navItems.push({ icon: Users, label: t("nav_user_manager"), path: "/users" });
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("auth_signed_out"));
    onOpenChange(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Shield className="w-6 h-6 text-primary" />
              )}
            </div>
            <SheetTitle className="text-foreground">{t("app_name")}</SheetTitle>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "sidebar-link min-h-[48px]",
                  isActive && "active"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </Link>
            );
          })}
        </nav>

        {/* Language Toggle */}
        <div className="px-4 py-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-secondary/50 min-h-[48px]"
            onClick={toggleLanguage}
          >
            <Globe className="w-5 h-5" />
            <span className="ml-3 flex items-center gap-2">
              {language === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
            </span>
          </Button>
        </div>

        {/* User & Sign Out */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 min-h-[48px]"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">{t("btn_sign_out")}</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
