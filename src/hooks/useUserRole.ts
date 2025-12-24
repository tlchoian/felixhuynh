import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "member";
export type UserStatus = "pending" | "active" | "suspended";

interface UserRoleData {
  role: AppRole | null;
  status: UserStatus | null;
  loading: boolean;
  isAdmin: boolean;
}

export function useUserRole(): UserRoleData {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setStatus(null);
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch role from user_roles table
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        // Fetch status from profiles table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        setRole((roleData?.role as AppRole) || "member");
        setStatus((profileData?.status as UserStatus) || "pending");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("member");
        setStatus("pending");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return {
    role,
    status,
    loading,
    isAdmin: role === "admin",
  };
}
