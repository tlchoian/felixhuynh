import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = async (
    actionType: "CREATE" | "UPDATE" | "DELETE",
    entityName: string,
    description: string
  ) => {
    if (!user) return;

    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email || "Unknown",
        action_type: actionType,
        entity_name: entityName,
        description: description,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  return { logActivity };
}
