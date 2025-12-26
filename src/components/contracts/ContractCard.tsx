import { MoreVertical, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

interface Contract {
  id: string;
  asset_name: string;
  type: string;
  provider: string;
  start_date: string | null;
  expiry_date: string;
  cost: number;
  billing_cycle: string;
  status: string;
  notes: string | null;
}

interface ContractCardProps {
  contract: Contract;
  typeColors: Record<string, string>;
  typeIcons: Record<string, any>;
  daysRemaining: number;
  onEdit: (contract: Contract) => void;
  onDelete: (id: string, assetName: string) => void;
}

export function ContractCard({ 
  contract, 
  typeColors, 
  typeIcons, 
  daysRemaining, 
  onEdit, 
  onDelete 
}: ContractCardProps) {
  const { t } = useLanguage();
  const TypeIcon = typeIcons[contract.type] || FileText;

  const getStatusClassName = () => {
    switch (contract.status) {
      case "Expired":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "Cancelled":
        return "bg-muted/50 text-muted-foreground border-muted/30";
      default:
        return "bg-success/20 text-success border-success/30";
    }
  };

  const getDaysClassName = () => {
    if (daysRemaining <= 7) return "bg-destructive/20 text-destructive border-destructive/30";
    if (daysRemaining <= 30) return "bg-warning/20 text-warning border-warning/30";
    return "bg-success/20 text-success border-success/30";
  };

  return (
    <div className="glass-card p-4 rounded-xl shadow-md space-y-3">
      {/* Top Row: Name + Action Menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TypeIcon className="w-5 h-5 text-primary flex-shrink-0" />
          <h3 className="font-semibold text-foreground text-base truncate">
            {contract.asset_name}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onEdit(contract)} className="gap-2">
              <Pencil className="w-4 h-4" />
              {t("btn_edit")}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(contract.id, contract.asset_name)} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              {t("btn_delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle Row: Secondary Details */}
      <p className="text-sm text-muted-foreground">
        {contract.provider} • {contract.type} • {contract.cost.toLocaleString('vi-VN')} đ/{contract.billing_cycle === "Monthly" ? "tháng" : "năm"}
      </p>

      {/* Bottom Row: Status + Expiry Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`status-badge text-xs ${getStatusClassName()}`}>
          {contract.status}
        </span>
        <span className={`status-badge text-xs ${getDaysClassName()}`}>
          {contract.expiry_date} • {daysRemaining} {t("contracts_days")}
        </span>
      </div>

      {/* Notes (optional) */}
      {contract.notes && (
        <p className="text-xs text-muted-foreground/80 line-clamp-2 pt-1 border-t border-border/50">
          {contract.notes}
        </p>
      )}
    </div>
  );
}
