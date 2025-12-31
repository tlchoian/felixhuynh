import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

export type ModuleKey = "credentials" | "contracts" | "network" | "tasks" | "wiki";
export type AccessLevel = "none" | "read" | "write";

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

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, { en: string; vi: string }> = {
  none: { en: "No Access", vi: "Không Truy Cập" },
  read: { en: "View Only", vi: "Chỉ Xem" },
  write: { en: "Full Access", vi: "Toàn Quyền" },
};

export type ModulePermissions = Record<ModuleKey, AccessLevel>;

// Default permissions for new users
const DEFAULT_PERMISSIONS: ModulePermissions = {
  credentials: "none",
  contracts: "none",
  network: "none",
  tasks: "write",
  wiki: "write",
};

interface UserPermissionsData {
  permissions: ModulePermissions;
  loading: boolean;
  hasAccess: (module: ModuleKey) => boolean;
  canWrite: (module: ModuleKey) => boolean;
  getAccessLevel: (module: ModuleKey) => AccessLevel;
  canAccessRoute: (path: string) => boolean;
}

export function useUserPermissions(): UserPermissionsData {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<ModulePermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions(DEFAULT_PERMISSIONS);
      setLoading(false);
      return;
    }

    // Admin has full access to everything
    if (!roleLoading && isAdmin) {
      const fullAccess: ModulePermissions = {
        credentials: "write",
        contracts: "write",
        network: "write",
        tasks: "write",
        wiki: "write",
      };
      setPermissions(fullAccess);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("module_permissions, allowed_modules")
          .eq("id", user.id)
          .maybeSingle();

        if (profileData?.module_permissions) {
          // New format: module_permissions JSONB
          const dbPermissions = profileData.module_permissions as Record<string, string>;
          const mergedPermissions: ModulePermissions = { ...DEFAULT_PERMISSIONS };
          
          ALL_MODULES.forEach((module) => {
            if (dbPermissions[module]) {
              mergedPermissions[module] = dbPermissions[module] as AccessLevel;
            }
          });
          
          setPermissions(mergedPermissions);
        } else if (profileData?.allowed_modules) {
          // Legacy format: allowed_modules array - migrate to new format
          const allowedModules = profileData.allowed_modules as ModuleKey[];
          const legacyPermissions: ModulePermissions = { ...DEFAULT_PERMISSIONS };
          
          ALL_MODULES.forEach((module) => {
            legacyPermissions[module] = allowedModules.includes(module) ? "write" : "none";
          });
          
          setPermissions(legacyPermissions);
        } else {
          setPermissions(DEFAULT_PERMISSIONS);
        }
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        setPermissions(DEFAULT_PERMISSIONS);
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading) {
      fetchPermissions();
    }
  }, [user, isAdmin, roleLoading]);

  const getAccessLevel = (module: ModuleKey): AccessLevel => {
    if (isAdmin) return "write";
    return permissions[module] || "none";
  };

  const hasAccess = (module: ModuleKey): boolean => {
    if (isAdmin) return true;
    const level = permissions[module];
    return level === "read" || level === "write";
  };

  const canWrite = (module: ModuleKey): boolean => {
    if (isAdmin) return true;
    return permissions[module] === "write";
  };

  const canAccessRoute = (path: string): boolean => {
    if (isAdmin) return true;
    
    // Find the module key for this path
    const moduleEntry = Object.entries(MODULE_ROUTES).find(([, route]) => route === path);
    if (!moduleEntry) return true; // Allow access to non-module routes (dashboard, settings, etc.)
    
    const moduleKey = moduleEntry[0] as ModuleKey;
    return hasAccess(moduleKey);
  };

  return {
    permissions,
    loading: loading || roleLoading,
    hasAccess,
    canWrite,
    getAccessLevel,
    canAccessRoute,
  };
}

// Legacy export for backwards compatibility
export function useModuleWriteAccess(module: ModuleKey): { canWrite: boolean; loading: boolean } {
  const { canWrite, loading } = useUserPermissions();
  return { canWrite: canWrite(module), loading };
}
