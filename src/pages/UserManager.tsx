import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { ALL_MODULES, MODULE_LABELS, ModuleKey } from "@/hooks/useUserPermissions";
import { PermissionsModal } from "@/components/users/PermissionsModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, Ban, Loader2, Shield, UserCheck, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  allowed_modules: string[] | null;
}

interface UserWithRole extends UserProfile {
  role: string;
}

export default function UserManager() {
  const { t, language } = useLanguage();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (roleError) throw roleError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "member",
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId);

      if (error) throw error;
      toast.success(t("user_approved"));
      fetchUsers();
    } catch (error) {
      console.error("Error approving user:", error);
      toast.error(t("error"));
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "suspended" })
        .eq("id", userId);

      if (error) throw error;
      toast.success(t("user_blocked"));
      fetchUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error(t("error"));
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      // If changing to admin, give full access
      if (newRole === "admin") {
        await supabase
          .from("profiles")
          .update({ allowed_modules: ALL_MODULES })
          .eq("id", userId);
      }

      toast.success(t("role_updated"));
      fetchUsers();
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error(t("error"));
    }
  };

  const handleOpenPermissions = (user: UserWithRole) => {
    setSelectedUser(user);
    setPermissionsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success border-success/30">{t("status_active")}</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning border-warning/30">{t("status_pending")}</Badge>;
      case "suspended":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{t("status_suspended")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPermissionsBadges = (user: UserWithRole) => {
    if (user.role === "admin") {
      return <Badge className="bg-primary/20 text-primary border-primary/30">{t("permissions_admin_note").split(".")[0]}</Badge>;
    }
    
    const modules = (user.allowed_modules as ModuleKey[]) || [];
    if (modules.length === 0) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }
    
    if (modules.length === ALL_MODULES.length) {
      return <Badge variant="outline">{language === "vi" ? "Đầy đủ" : "Full Access"}</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {modules.slice(0, 2).map((mod) => (
          <Badge key={mod} variant="outline" className="text-xs">
            {MODULE_LABELS[mod]?.[language] || mod}
          </Badge>
        ))}
        {modules.length > 2 && (
          <Badge variant="outline" className="text-xs">+{modules.length - 2}</Badge>
        )}
      </div>
    );
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("user_manager_title")}</h1>
          <p className="text-muted-foreground">{t("user_manager_subtitle")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {t("total_users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-success" />
              {t("active_users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">
              {users.filter((u) => u.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-warning" />
              {t("pending_users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">
              {users.filter((u) => u.status === "pending").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{t("all_users")}</CardTitle>
          <CardDescription>{t("user_manager_table_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("user_avatar")}</TableHead>
                    <TableHead>{t("user_fullname")}</TableHead>
                    <TableHead>{t("user_email")}</TableHead>
                    <TableHead>{t("user_role")}</TableHead>
                    <TableHead>{t("user_permissions")}</TableHead>
                    <TableHead>{t("user_status")}</TableHead>
                    <TableHead>{t("user_joined")}</TableHead>
                    <TableHead className="text-right">{t("vault_actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.full_name || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: "admin" | "member") => handleRoleChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">{t("role_member")}</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {getPermissionsBadges(user)}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPermissions(user)}
                          >
                            <Settings2 className="w-4 h-4 mr-1" />
                            {t("btn_permissions")}
                          </Button>
                          {user.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleApprove(user.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {t("btn_approve")}
                            </Button>
                          )}
                          {user.status !== "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => handleBlock(user.id)}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              {t("btn_block")}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Modal */}
      {selectedUser && (
        <PermissionsModal
          open={permissionsModalOpen}
          onOpenChange={setPermissionsModalOpen}
          userId={selectedUser.id}
          userName={selectedUser.full_name || selectedUser.email || "User"}
          currentModules={(selectedUser.allowed_modules as ModuleKey[]) || []}
          isUserAdmin={selectedUser.role === "admin"}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
}
