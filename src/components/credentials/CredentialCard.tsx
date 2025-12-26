import { useState } from "react";
import { Eye, EyeOff, Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Credential {
  id: string;
  service_name: string;
  url: string | null;
  username: string;
  password: string;
  category: string;
}

// Organization badge colors
const organizationBadgeColors: Record<string, string> = {
  "Cá nhân": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Personal": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Mvillage": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Fxdigital": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Silkvillage": "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

interface CredentialCardProps {
  credential: Credential;
  categoryColors: Record<string, string>;
  organizationColors?: Record<string, string>;
  onEdit: (credential: Credential) => void;
  onDelete: (id: string, serviceName: string) => void;
}

export function CredentialCard({ credential, categoryColors, organizationColors, onEdit, onDelete }: CredentialCardProps) {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} ${t("vault_copied")}`);
  };

  // Get organization badge color
  const getOrgBadgeColor = (category: string) => {
    return organizationBadgeColors[category] || organizationColors?.[category] || categoryColors[category] || "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{credential.service_name}</h3>
          <span className={`inline-block mt-1 status-badge text-xs ${getOrgBadgeColor(credential.category)}`}>
            {credential.category}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-primary"
            onClick={() => onEdit(credential)}
          >
            <Pencil className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive hover:text-destructive"
            onClick={() => onDelete(credential.id, credential.service_name)}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* URL */}
      {credential.url && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{t("vault_url")}</p>
          <a
            href={credential.url.startsWith("http") ? credential.url : `https://${credential.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
          >
            {credential.url}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      )}

      {/* Username */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{t("vault_username")}</p>
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2">
          <span className="font-mono text-sm text-foreground flex-1 break-all">{credential.username}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => copyToClipboard(credential.username, t("vault_username"))}
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{t("vault_password")}</p>
        <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-2">
          <span className="font-mono text-sm text-foreground flex-1 break-all">
            {showPassword ? credential.password : "••••••••••••"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => copyToClipboard(credential.password, t("vault_password"))}
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
