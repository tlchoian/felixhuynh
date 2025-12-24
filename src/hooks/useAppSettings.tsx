import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AppSettingsContextType {
  logoUrl: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("app_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setLogoUrl((data as any).logo_url || null);
      }
    } catch (error) {
      console.error("Error fetching app settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return (
    <AppSettingsContext.Provider value={{ logoUrl, loading, refetch: fetchSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  // Return default values if not within provider (e.g., on Auth page before login)
  if (context === undefined) {
    return { logoUrl: null, loading: false, refetch: async () => {} };
  }
  return context;
}
