import { 
  ClipboardList, 
  FileWarning, 
  Server, 
  KeyRound,
  Plus,
  Lock,
  Activity,
  ArrowRight
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const quickActions = [
  { icon: Plus, label: "Add New Ticket", path: "/tasks", color: "bg-primary/20 text-primary" },
  { icon: Lock, label: "Add New Password", path: "/credentials", color: "bg-success/20 text-success" },
  { icon: Activity, label: "Check Server Status", path: "/network", color: "bg-warning/20 text-warning" },
];

const recentActivity = [
  { id: 1, action: "New credential added", target: "AWS Console", time: "5 min ago", type: "credential" },
  { id: 2, action: "Contract expiring soon", target: "SSL Certificate - domain.com", time: "1 hour ago", type: "warning" },
  { id: 3, action: "Task completed", target: "Router firmware update", time: "2 hours ago", type: "success" },
  { id: 4, action: "New device registered", target: "AP-Floor-3 (192.168.1.45)", time: "3 hours ago", type: "network" },
  { id: 5, action: "Wiki article updated", target: "Zabbix Configuration Guide", time: "5 hours ago", type: "wiki" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your IT infrastructure overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks Pending"
          value={12}
          icon={ClipboardList}
          trend={{ value: 8, isPositive: false }}
        />
        <StatCard
          title="Contracts Expiring Soon"
          value={3}
          icon={FileWarning}
          variant="warning"
        />
        <StatCard
          title="Active Network Devices"
          value={47}
          icon={Server}
          variant="success"
        />
        <StatCard
          title="Total Credentials"
          value={156}
          icon={KeyRound}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
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

        {/* Recent Activity */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'warning' ? 'bg-warning' :
                  activity.type === 'success' ? 'bg-success' :
                  'bg-primary'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.target}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">System Health Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { name: "Primary Server", status: "Online", uptime: "99.9%" },
            { name: "Backup Server", status: "Online", uptime: "99.7%" },
            { name: "Database Cluster", status: "Online", uptime: "99.8%" },
            { name: "CDN Network", status: "Degraded", uptime: "98.2%" },
          ].map((system, index) => (
            <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  system.status === 'Online' ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'
                }`} />
                <span className={`text-sm font-medium ${
                  system.status === 'Online' ? 'text-success' : 'text-warning'
                }`}>{system.status}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{system.name}</p>
              <p className="text-xs text-muted-foreground">Uptime: {system.uptime}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
