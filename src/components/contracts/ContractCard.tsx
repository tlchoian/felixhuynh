import { Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    if (daysRemaining <= 7) return "text-destructive";
    if (daysRemaining <= 30) return "text-warning";
    return "text-success";
  };

  const getDateClassName = () => {
    if (daysRemaining <= 7) return "text-destructive font-bold";
    if (daysRemaining <= 30) return "text-warning font-semibold";
    return "text-foreground";
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold text-foreground truncate">{contract.asset_name}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`status-badge text-xs ${typeColors[contract.type] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
              {contract.type}
            </span>
            <span className={`status-badge text-xs ${getStatusClassName()}`}>
              {contract.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(contract)}
          >
            <Pencil className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive hover:text-destructive"
            onClick={() => onDelete(contract.id, contract.asset_name)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("contracts_provider")}</p>
          <p className="text-sm text-foreground">{contract.provider}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("contracts_cost")}</p>
          <p className="text-sm text-foreground">
            {contract.cost.toLocaleString('vi-VN')} đ/{contract.billing_cycle === "Monthly" ? "tháng" : "năm"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("contracts_expiry_date")}</p>
          <p className={`text-sm font-mono ${getDateClassName()}`}>
            {contract.expiry_date}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("contracts_days_left")}</p>
          <p className={`text-sm font-bold ${getDaysClassName()}`}>
            {daysRemaining} {t("contracts_days")}
          </p>
        </div>
      </div>

      {/* Notes */}
      {contract.notes && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-1">{t("contracts_notes")}</p>
          <p className="text-sm text-foreground/80 line-clamp-2">{contract.notes}</p>
        </div>
      )}
    </div>
  );
}
