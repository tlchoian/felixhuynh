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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: KeyRound, label: "Credential Vault", path: "/credentials" },
  { icon: FileText, label: "Contracts & Licenses", path: "/contracts" },
  { icon: Network, label: "Network IPAM", path: "/network" },
  { icon: ClipboardList, label: "Task Tracker", path: "/tasks" },
  { icon: BookOpen, label: "Tech Wiki", path: "/wiki" },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300",
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
              <h1 className="font-semibold text-foreground">IT Omni</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
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
      <nav className="p-4 space-y-2">
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

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className={cn(
          "glass-card p-4",
          collapsed && "p-2"
        )}>
          {!collapsed ? (
            <div className="animate-fade-in">
              <p className="text-xs text-muted-foreground">System Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-success">All Systems Operational</span>
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
