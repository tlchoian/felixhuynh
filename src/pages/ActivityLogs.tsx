import { useState, useEffect } from "react";
import { History, Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  user_email: string;
  action_type: string;
  entity_name: string;
  description: string;
  created_at: string;
}

const actionStyles: Record<string, { bg: string; text: string; icon: any }> = {
  CREATE: { bg: "bg-success/20", text: "text-success", icon: Plus },
  UPDATE: { bg: "bg-warning/20", text: "text-warning", icon: Edit },
  DELETE: { bg: "bg-destructive/20", text: "text-destructive", icon: Trash2 },
};

export default function ActivityLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRelativeTime = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          {t("nav_activity_logs")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("logs_subtitle")}</p>
      </div>

      {/* Timeline */}
      <div className="glass-card p-6">
        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t("logs_no_logs")}</h3>
            <p className="text-sm text-muted-foreground">{t("logs_no_logs_desc")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => {
              const actionStyle = actionStyles[log.action_type] || actionStyles.CREATE;
              const ActionIcon = actionStyle.icon;
              return (
                <div
                  key={log.id}
                  className="relative pl-8 pb-4 border-l-2 border-border/50 last:border-l-transparent"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${actionStyle.bg} flex items-center justify-center ring-4 ring-background`}
                  >
                    <ActionIcon className={`w-2.5 h-2.5 ${actionStyle.text}`} />
                  </div>

                  {/* Content */}
                  <div className="ml-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${actionStyle.bg} ${actionStyle.text}`}
                      >
                        {log.action_type}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {log.entity_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {log.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("logs_by")} <span className="text-primary">{log.user_email}</span> • {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
