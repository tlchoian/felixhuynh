import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  KeyRound,
  FileText,
  Network,
  ClipboardList,
  BookOpen,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Globe,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, label: t("nav_dashboard"), path: "/" },
    { icon: KeyRound, label: t("nav_vault"), path: "/credentials" },
    { icon: FileText, label: t("nav_contracts"), path: "/contracts" },
    { icon: Network, label: t("nav_network"), path: "/network" },
    { icon: ClipboardList, label: t("nav_tasks"), path: "/tasks" },
    { icon: BookOpen, label: t("nav_wiki"), path: "/wiki" },
    { icon: History, label: t("nav_activity_logs"), path: "/activity-logs" },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("auth_signed_out"));
  };

  const toggleLanguage = () => {
    setLanguage(language === "vi" ? "en" : "vi");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-semibold text-foreground">{t("app_name")}</h1>
              <p className="text-xs text-muted-foreground">{t("app_subtitle")}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-link",
                isActive && "active",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Language Toggle */}
      <div className="px-4 py-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
          onClick={toggleLanguage}
        >
          <Globe className="w-5 h-5" />
          {!collapsed && (
            <span className="ml-3 flex items-center gap-2">
              {language === "vi" ? "🇻🇳 Tiếng Việt" : "🇬🇧 English"}
            </span>
          )}
        </Button>
      </div>

      {/* User & Sign Out */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {user && (
          <div className={cn(
            "flex items-center gap-3 px-2",
            collapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full text-muted-foreground hover:text-foreground hover:bg-destructive/10",
            collapsed ? "px-0 justify-center" : "justify-start"
          )}
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">{t("btn_sign_out")}</span>}
        </Button>
      </div>

      {/* Status */}
      <div className="p-4">
        <div className={cn(
          "glass-card p-4",
          collapsed && "p-2"
        )}>
          {!collapsed ? (
            <div className="animate-fade-in">
              <p className="text-xs text-muted-foreground">{t("system_status")}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-success">{t("all_systems_operational")}</span>
              </div>
            </div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-success animate-pulse mx-auto" />
          )}
        </div>
      </div>
    </aside>
  );
}
