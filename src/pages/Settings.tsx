import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Send, Save, Loader2 } from "lucide-react";

interface AppSettings {
  id?: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  enable_expiry_alerts: boolean;
}

export default function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    telegram_bot_token: "",
    telegram_chat_id: "",
    enable_expiry_alerts: false,
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          telegram_bot_token: data.telegram_bot_token || "",
          telegram_chat_id: data.telegram_chat_id || "",
          enable_expiry_alerts: data.enable_expiry_alerts,
        });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        telegram_bot_token: settings.telegram_bot_token || null,
        telegram_chat_id: settings.telegram_chat_id || null,
        enable_expiry_alerts: settings.enable_expiry_alerts,
      };

      let error;
      if (settings.id) {
        // Update existing
        const result = await supabase
          .from("app_settings")
          .update(payload)
          .eq("id", settings.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from("app_settings")
          .insert(payload)
          .select()
          .single();
        error = result.error;
        if (result.data) {
          setSettings((prev) => ({ ...prev, id: result.data.id }));
        }
      }

      if (error) throw error;

      toast({
        title: t("settings_saved"),
        description: t("settings_saved_description"),
      });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
          <p className="text-muted-foreground">{t("settings_description")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("telegram_config")}
          </CardTitle>
          <CardDescription>{t("telegram_config_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bot_token">{t("telegram_bot_token")}</Label>
              <Input
                id="bot_token"
                type="password"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={settings.telegram_bot_token}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    telegram_bot_token: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat_id">{t("telegram_chat_id")}</Label>
              <Input
                id="chat_id"
                type="text"
                placeholder="-1001234567890"
                value={settings.telegram_chat_id}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    telegram_chat_id: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="expiry_alerts" className="text-base">
                {t("enable_expiry_alerts")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("enable_expiry_alerts_description")}
              </p>
            </div>
            <Switch
              id="expiry_alerts"
              checked={settings.enable_expiry_alerts}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  enable_expiry_alerts: checked,
                }))
              }
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t("save_config")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
