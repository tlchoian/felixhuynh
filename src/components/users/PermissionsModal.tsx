import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  ALL_MODULES, 
  MODULE_LABELS, 
  ACCESS_LEVEL_LABELS,
  ModuleKey, 
  AccessLevel,
  ModulePermissions 
} from "@/hooks/useUserPermissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, KeyRound, FileText, Network, ClipboardList, BookOpen, Ban, Eye, PenLine } from "lucide-react";

interface PermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentPermissions: ModulePermissions;
  isUserAdmin: boolean;
  onUpdate: () => void;
}

const MODULE_ICONS: Record<ModuleKey, React.ElementType> = {
  credentials: KeyRound,
  contracts: FileText,
  network: Network,
  tasks: ClipboardList,
  wiki: BookOpen,
};

const ACCESS_LEVEL_ICONS: Record<AccessLevel, React.ElementType> = {
  none: Ban,
  read: Eye,
  write: PenLine,
};

const ACCESS_LEVEL_COLORS: Record<AccessLevel, string> = {
  none: "text-muted-foreground",
  read: "text-blue-500",
  write: "text-green-500",
};

export function PermissionsModal({
  open,
  onOpenChange,
  userId,
  userName,
  currentPermissions,
  isUserAdmin,
  onUpdate,
}: PermissionsModalProps) {
  const { t, language } = useLanguage();
  const [permissions, setPermissions] = useState<ModulePermissions>(currentPermissions);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPermissions(currentPermissions);
  }, [currentPermissions, open]);

  const handleChangeAccess = (module: ModuleKey, level: AccessLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: level,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ module_permissions: permissions })
        .eq("id", userId);

      if (error) throw error;
      toast.success(t("permissions_updated"));
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const accessLevels: AccessLevel[] = ["none", "read", "write"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("permissions_title")}</DialogTitle>
          <DialogDescription>
            {t("permissions_description").replace("{name}", userName)}
          </DialogDescription>
        </DialogHeader>

        {isUserAdmin ? (
          <div className="py-6 text-center">
            <p className="text-muted-foreground">{t("permissions_admin_note")}</p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {ALL_MODULES.map((module) => {
              const Icon = MODULE_ICONS[module];
              const label = MODULE_LABELS[module][language];
              const currentLevel = permissions[module];
              const LevelIcon = ACCESS_LEVEL_ICONS[currentLevel];

              return (
                <div
                  key={module}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <Label className="text-foreground font-medium">
                      {label}
                    </Label>
                  </div>
                  
                  <Select
                    value={currentLevel}
                    onValueChange={(value: AccessLevel) => handleChangeAccess(module, value)}
                  >
                    <SelectTrigger className="w-[160px] bg-background">
                      <div className="flex items-center gap-2">
                        <LevelIcon className={`w-4 h-4 ${ACCESS_LEVEL_COLORS[currentLevel]}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {accessLevels.map((level) => {
                        const LIcon = ACCESS_LEVEL_ICONS[level];
                        return (
                          <SelectItem key={level} value={level}>
                            <div className="flex items-center gap-2">
                              <LIcon className={`w-4 h-4 ${ACCESS_LEVEL_COLORS[level]}`} />
                              <span>{ACCESS_LEVEL_LABELS[level][language]}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            
            {/* Legend */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">{t("permissions_legend")}:</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{ACCESS_LEVEL_LABELS.none[language]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-muted-foreground">{ACCESS_LEVEL_LABELS.read[language]}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-muted-foreground">{ACCESS_LEVEL_LABELS.write[language]}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("btn_cancel")}
          </Button>
          {!isUserAdmin && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("btn_save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
