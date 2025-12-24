import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: "default" | "warning" | "danger" | "success";
  href?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className, variant = "default", href }: StatCardProps) {
  const navigate = useNavigate();
  
  const variantStyles = {
    default: "border-border/50",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-destructive/30 bg-destructive/5",
    success: "border-success/30 bg-success/5",
  };

  const iconStyles = {
    default: "text-primary bg-primary/20",
    warning: "text-warning bg-warning/20",
    danger: "text-destructive bg-destructive/20",
    success: "text-success bg-success/20",
  };

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <div 
      className={cn(
        "stat-card", 
        variantStyles[variant], 
        className,
        href && "cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
      )}
      onClick={handleClick}
      role={href ? "button" : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={href ? (e) => e.key === "Enter" && handleClick() : undefined}
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
