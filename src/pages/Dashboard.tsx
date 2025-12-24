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
  Loader2,
  Clock
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, parseISO, startOfMonth, addMonths } from "date-fns";
import { vi } from "date-fns/locale";

interface DashboardStats {
  pendingTasks: number;
  expiringContracts: number;
  activeDevices: number;
  totalCredentials: number;
}

interface Contract {
  expiry_date: string;
  cost: number;
  billing_cycle: string;
}

interface DeviceTypeStat {
  name: string;
  value: number;
}

interface ActivityLog {
  id: string;
  action_type: string;
  entity_name: string;
  description: string;
  created_at: string;
  user_email: string;
}

interface MonthlyCost {
  month: string;
  cost: number;
}

interface ContractExpiry {
  month: string;
  count: number;
}

// Professional tech colors for device types
const DEVICE_COLORS = {
  Router: "#3b82f6",      // Blue
  Switch: "#8b5cf6",      // Purple
  AP: "#06b6d4",          // Cyan
  Server: "#f97316",      // Orange
  Camera: "#ec4899",      // Pink
  Workstation: "#10b981", // Emerald
};

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
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCost[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceTypeStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [contractExpiry, setContractExpiry] = useState<ContractExpiry[]>([]);

  const quickActions = [
    { icon: Plus, label: t("dashboard_add_ticket"), path: "/tasks", color: "bg-primary/20 text-primary" },
    { icon: Lock, label: t("dashboard_add_password"), path: "/credentials", color: "bg-success/20 text-success" },
    { icon: Activity, label: t("dashboard_check_server"), path: "/network", color: "bg-warning/20 text-warning" },
  ];

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      try {
        // Fetch basic stats
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

        // Fetch contracts for cost analysis and expiry timeline
        const { data: contracts } = await supabase
          .from("contracts")
          .select("expiry_date, cost, billing_cycle");

        if (contracts) {
          const costByMonth = calculateMonthlyCosts(contracts);
          setMonthlyCosts(costByMonth);
          
          // Calculate contract expiry by month for next 6 months
          const expiryByMonth = calculateContractExpiry(contracts);
          setContractExpiry(expiryByMonth);
        }

        // Fetch device types for pie chart
        const { data: devices } = await supabase
          .from("network_devices")
          .select("type");

        if (devices) {
          const typeCounts: Record<string, number> = {};
          devices.forEach((d) => {
            typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
          });
          const deviceData = Object.entries(typeCounts).map(([name, value]) => ({
            name,
            value,
          }));
          setDeviceStats(deviceData);
        }

        // Fetch recent activity logs
        const { data: logs } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (logs) {
          setRecentActivity(logs);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const calculateMonthlyCosts = (contracts: Contract[]): MonthlyCost[] => {
    const today = new Date();
    const monthlyData: Record<string, number> = {};

    // Initialize next 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = startOfMonth(addMonths(today, i));
      const monthKey = format(monthDate, "yyyy-MM");
      monthlyData[monthKey] = 0;
    }

    // Calculate costs per month
    contracts.forEach((contract) => {
      const monthlyCost = contract.billing_cycle === "Monthly" 
        ? contract.cost 
        : contract.cost / 12;

      // Distribute across months until expiry
      const expiryDate = parseISO(contract.expiry_date);
      
      Object.keys(monthlyData).forEach((monthKey) => {
        const monthDate = parseISO(monthKey + "-01");
        if (monthDate <= expiryDate) {
          monthlyData[monthKey] += monthlyCost;
        }
      });
    });

    return Object.entries(monthlyData).map(([month, cost]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy"),
      cost: Math.round(cost * 100) / 100,
    }));
  };

  const calculateContractExpiry = (contracts: Contract[]): ContractExpiry[] => {
    const today = new Date();
    const expiryData: Record<string, number> = {};

    // Initialize next 6 months
    for (let i = 0; i < 6; i++) {
      const monthDate = startOfMonth(addMonths(today, i));
      const monthKey = format(monthDate, "yyyy-MM");
      expiryData[monthKey] = 0;
    }

    // Count contracts expiring in each month
    contracts.forEach((contract) => {
      const expiryDate = parseISO(contract.expiry_date);
      const expiryMonthKey = format(startOfMonth(expiryDate), "yyyy-MM");
      
      if (expiryData.hasOwnProperty(expiryMonthKey)) {
        expiryData[expiryMonthKey]++;
      }
    });

    // Vietnamese month abbreviations: T1, T2, T3, etc.
    const viMonthMap: Record<string, string> = {
      "Jan": "T1", "Feb": "T2", "Mar": "T3", "Apr": "T4",
      "May": "T5", "Jun": "T6", "Jul": "T7", "Aug": "T8",
      "Sep": "T9", "Oct": "T10", "Nov": "T11", "Dec": "T12"
    };
    
    return Object.entries(expiryData).map(([month, count]) => {
      const engMonth = format(parseISO(month + "-01"), "MMM");
      return {
        month: viMonthMap[engMonth] || engMonth,
        count,
      };
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("logs_just_now");
    if (diffMins < 60) return `${diffMins} ${t("logs_minutes_ago")}`;
    if (diffHours < 24) return `${diffHours} ${t("logs_hours_ago")}`;
    return `${diffDays} ${t("logs_days_ago")}`;
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "CREATE":
        return <Plus className="w-4 h-4 text-success" />;
      case "DELETE":
        return <Clock className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user?.email) return "Sếp";
    const emailPrefix = user.email.split("@")[0];
    // Capitalize first letter
    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Chào mừng {getUserDisplayName()} trở lại! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Hệ thống đã sẵn sàng phục vụ.</p>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Type Pie Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard_device_distribution")}</h2>
          {deviceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceStats}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                >
                  {deviceStats.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={DEVICE_COLORS[entry.name as keyof typeof DEVICE_COLORS] || "#6366f1"} 
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} ${t("devices")}`, 
                    t(`device_${name.toLowerCase()}` as any) || name
                  ]}
                />
                <Legend 
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("network_no_devices")}
            </div>
          )}
        </div>

        {/* Contract Expiry Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard_contract_expiry")}</h2>
          {contractExpiry.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contractExpiry} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [
                    `${value} ${t("contracts")}`, 
                    t("dashboard_expiring")
                  ]}
                />
                <Bar 
                  dataKey="count" 
                  radius={[6, 6, 0, 0]}
                >
                  {contractExpiry.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count > 0 ? "#ef4444" : "#3b82f6"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("contracts_no_contracts")}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t("dashboard_recent_activity")}</h2>
            <Link to="/activity">
              <Button variant="ghost" size="sm">
                {t("btn_view_all")}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
                >
                  <div className="p-2 rounded-lg bg-muted/50">
                    {getActionIcon(log.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{log.entity_name}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {t("logs_no_logs")}
            </div>
          )}
        </div>

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
