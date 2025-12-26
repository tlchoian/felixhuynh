import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

export type ModuleKey = "credentials" | "contracts" | "network" | "tasks" | "wiki";

export const ALL_MODULES: ModuleKey[] = ["credentials", "contracts", "network", "tasks", "wiki"];

export const MODULE_LABELS: Record<ModuleKey, { en: string; vi: string }> = {
  credentials: { en: "Credential Vault", vi: "Kho Mật Khẩu" },
  contracts: { en: "Contracts & Licenses", vi: "Hợp Đồng & Giấy Phép" },
  network: { en: "Network IPAM", vi: "Quản Lý IP" },
  tasks: { en: "Task Tracker", vi: "Theo Dõi Công Việc" },
  wiki: { en: "Tech Wiki", vi: "Wiki Kỹ Thuật" },
};

export const MODULE_ROUTES: Record<ModuleKey, string> = {
  credentials: "/credentials",
  contracts: "/contracts",
  network: "/network",
  tasks: "/tasks",
  wiki: "/wiki",
};

interface UserPermissionsData {
  allowedModules: ModuleKey[];
  loading: boolean;
  hasAccess: (module: ModuleKey) => boolean;
  canAccessRoute: (path: string) => boolean;
}

export function useUserPermissions(): UserPermissionsData {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [allowedModules, setAllowedModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAllowedModules([]);
      setLoading(false);
      return;
    }

    // Admin has access to everything
    if (!roleLoading && isAdmin) {
      setAllowedModules(ALL_MODULES);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("allowed_modules")
          .eq("id", user.id)
          .maybeSingle();

        const modules = (profileData?.allowed_modules as ModuleKey[]) || ["wiki", "tasks"];
        setAllowedModules(modules);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        setAllowedModules(["wiki", "tasks"]);
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading) {
      fetchPermissions();
    }
  }, [user, isAdmin, roleLoading]);

  const hasAccess = (module: ModuleKey): boolean => {
    if (isAdmin) return true;
    return allowedModules.includes(module);
  };

  const canAccessRoute = (path: string): boolean => {
    if (isAdmin) return true;
    
    // Find the module key for this path
    const moduleEntry = Object.entries(MODULE_ROUTES).find(([, route]) => route === path);
    if (!moduleEntry) return true; // Allow access to non-module routes (dashboard, settings, etc.)
    
    const moduleKey = moduleEntry[0] as ModuleKey;
    return allowedModules.includes(moduleKey);
  };

  return {
    allowedModules,
    loading: loading || roleLoading,
    hasAccess,
    canAccessRoute,
  };
}
