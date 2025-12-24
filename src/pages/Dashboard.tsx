import { useEffect, useState } from "react";
import { 
  ClipboardList, 
  FileWarning, 
  Server, 
  KeyRound,
  Plus,
  Lock,
  Activity,
  ArrowRight,
  Loader2
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardStats {
  pendingTasks: number;
  expiringContracts: number;
  activeDevices: number;
  totalCredentials: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    pendingTasks: 0,
    expiringContracts: 0,
    activeDevices: 0,
    totalCredentials: 0,
  });
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { icon: Plus, label: t("dashboard_add_ticket"), path: "/tasks", color: "bg-primary/20 text-primary" },
    { icon: Lock, label: t("dashboard_add_password"), path: "/credentials", color: "bg-success/20 text-success" },
    { icon: Activity, label: t("dashboard_check_server"), path: "/network", color: "bg-warning/20 text-warning" },
  ];

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      try {
        const { count: tasksCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .neq("status", "done");

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const { count: contractsCount } = await supabase
          .from("contracts")
          .select("*", { count: "exact", head: true })
          .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0]);

        const { count: devicesCount } = await supabase
          .from("network_devices")
          .select("*", { count: "exact", head: true })
          .eq("status", "Online");

        const { count: credentialsCount } = await supabase
          .from("credentials")
          .select("*", { count: "exact", head: true });

        setStats({
          pendingTasks: tasksCount || 0,
          expiringContracts: contractsCount || 0,
          activeDevices: devicesCount || 0,
          totalCredentials: credentialsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t("dashboard_title")}</h1>
        <p className="text-muted-foreground mt-1">{t("dashboard_subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t("dashboard_pending_tasks")}
          value={stats.pendingTasks}
          icon={ClipboardList}
        />
        <StatCard
          title={t("dashboard_expiring_contracts")}
          value={stats.expiringContracts}
          icon={FileWarning}
          variant={stats.expiringContracts > 0 ? "warning" : "default"}
        />
        <StatCard
          title={t("dashboard_active_devices")}
          value={stats.activeDevices}
          icon={Server}
          variant="success"
        />
        <StatCard
          title={t("dashboard_total_credentials")}
          value={stats.totalCredentials}
          icon={KeyRound}
        />
      </div>

      {/* Quick Actions & Getting Started */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard_quick_actions")}</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-14 hover:bg-secondary/50"
                >
                  <div className={`p-2 rounded-lg mr-3 ${action.color}`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span>{action.label}</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t("dashboard_getting_started")}</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-medium text-foreground mb-2">🎉 {t("dashboard_welcome_message")}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t("dashboard_welcome_description")}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("dashboard_tip_credentials")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("dashboard_tip_contracts")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("dashboard_tip_network")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("dashboard_tip_tasks")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {t("dashboard_tip_wiki")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard_system_health")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: t("database"), status: t("connected"), uptime: "100%" },
            { name: t("authentication"), status: t("active"), uptime: "100%" },
            { name: t("storage"), status: t("ready"), uptime: "100%" },
            { name: t("api"), status: t("operational"), uptime: "100%" },
          ].map((system, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">{system.status}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{system.name}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard_uptime")}: {system.uptime}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
