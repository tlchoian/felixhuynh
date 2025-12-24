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
import { Settings as SettingsIcon, Send, Save, Loader2, MessageCircle, Palette, Lock, Eye, EyeOff, Image } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

interface AppSettings {
  id?: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  enable_expiry_alerts: boolean;
  logo_url: string;
}

export default function Settings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { refetch: refetchAppSettings } = useAppSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [settings, setSettings] = useState<AppSettings>({
    telegram_bot_token: "",
    telegram_chat_id: "",
    enable_expiry_alerts: false,
    logo_url: "",
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
          logo_url: (data as any).logo_url || "",
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
        logo_url: settings.logo_url || null,
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

      await refetchAppSettings();
      
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

  const handleTestMessage = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      toast({
        title: t("error"),
        description: t("telegram_missing_config"),
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const url = `https://api.telegram.org/bot${settings.telegram_bot_token}/sendMessage?chat_id=${encodeURIComponent(settings.telegram_chat_id)}&text=${encodeURIComponent("✅ Hello from IT Omni App! Kết nối Telegram thành công.")}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        toast({
          title: t("telegram_test_success"),
          description: t("telegram_test_success_description"),
        });
      } else {
        throw new Error(data.description || "Telegram API error");
      }
    } catch (error: any) {
      console.error("Error sending test message:", error);
      toast({
        title: t("error"),
        description: error.message || t("telegram_test_failed"),
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: t("error"),
        description: t("validation_required"),
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t("error"),
        description: t("security_password_mismatch"),
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: t("error"),
        description: t("validation_password"),
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast({
        title: t("security_password_changed"),
        description: t("security_password_changed_description"),
      });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
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

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("save_config")}
            </Button>
            <Button 
              onClick={handleTestMessage} 
              disabled={testing || !settings.telegram_bot_token || !settings.telegram_chat_id}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="mr-2 h-4 w-4" />
              )}
              {t("telegram_send_test")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Branding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("branding_title")}
          </CardTitle>
          <CardDescription>{t("branding_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="logo_url">{t("branding_logo_url")}</Label>
            <div className="flex gap-4">
              <Input
                id="logo_url"
                type="url"
                placeholder="https://example.com/logo.png"
                value={settings.logo_url}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    logo_url: e.target.value,
                  }))
                }
                className="flex-1"
              />
              {settings.logo_url && (
                <div className="w-12 h-12 rounded-lg border border-border overflow-hidden flex items-center justify-center bg-background">
                  <img 
                    src={settings.logo_url} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("branding_logo_hint")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("security_title")}
          </CardTitle>
          <CardDescription>{t("security_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new_password">{t("security_new_password")}</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">{t("security_confirm_password")}</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={changingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            variant="outline"
          >
            {changingPassword ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {t("security_change_password")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
