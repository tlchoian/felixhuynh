import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { ALL_MODULES, MODULE_LABELS, ModuleKey } from "@/hooks/useUserPermissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, KeyRound, FileText, Network, ClipboardList, BookOpen } from "lucide-react";

interface PermissionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentModules: ModuleKey[];
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

export function PermissionsModal({
  open,
  onOpenChange,
  userId,
  userName,
  currentModules,
  isUserAdmin,
  onUpdate,
}: PermissionsModalProps) {
  const { t, language } = useLanguage();
  const [selectedModules, setSelectedModules] = useState<ModuleKey[]>(currentModules);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedModules(currentModules);
  }, [currentModules, open]);

  const handleToggleModule = (module: ModuleKey) => {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ allowed_modules: selectedModules })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
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
          <div className="space-y-4 py-4">
            {ALL_MODULES.map((module) => {
              const Icon = MODULE_ICONS[module];
              const label = MODULE_LABELS[module][language];
              const isChecked = selectedModules.includes(module);

              return (
                <div
                  key={module}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                >
                  <Checkbox
                    id={`module-${module}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggleModule(module)}
                  />
                  <Icon className="w-5 h-5 text-primary" />
                  <Label
                    htmlFor={`module-${module}`}
                    className="flex-1 cursor-pointer text-foreground"
                  >
                    {label}
                  </Label>
                </div>
              );
            })}
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
