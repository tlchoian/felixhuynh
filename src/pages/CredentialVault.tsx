import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Search,
  Copy,
  ExternalLink,
  Trash2,
  Shield,
  Lock,
  Loader2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { CsvImportModal } from "@/components/CsvImportModal";

interface Credential {
  id: string;
  service_name: string;
  url: string | null;
  username: string;
  password: string;
  category: string;
}

const categoryColors: Record<string, string> = {
  Server: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Social: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Hosting: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Cloud: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Database: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function CredentialVault() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { logActivity } = useActivityLog();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    service_name: "",
    url: "",
    username: "",
    password: "",
    category: "Cloud",
  });

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleSubmit = async () => {
    if (!formData.service_name || !formData.username || !formData.password) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("credentials").insert({
        user_id: user?.id,
        service_name: formData.service_name,
        url: formData.url || null,
        username: formData.username,
        password: formData.password,
        category: formData.category,
      });

      if (error) throw error;

      await logActivity("CREATE", "Credential", `${t("logs_credential_added")}: ${formData.service_name}`);
      toast.success(t("vault_credential_added"));
      setIsAddModalOpen(false);
      setFormData({ service_name: "", url: "", username: "", password: "", category: "Cloud" });
      fetchCredentials();
    } catch (error) {
      console.error("Error adding credential:", error);
      toast.error("Failed to add credential");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    try {
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
      await logActivity("DELETE", "Credential", `${t("logs_credential_deleted")}: ${serviceName}`);
      toast.success(t("vault_credential_deleted"));
      fetchCredentials();
    } catch (error) {
      console.error("Error deleting credential:", error);
      toast.error("Failed to delete credential");
    }
  };

  const handleCsvImport = async (data: Record<string, string>[]) => {
    const credentialsToInsert = data.map((row) => ({
      user_id: user?.id,
      service_name: row.service_name || row["Service Name"] || "",
      url: row.url || row["URL"] || null,
      username: row.username || row["Username"] || "",
      password: row.password || row["Password"] || "",
      category: row.category || row["Category"] || "Cloud",
    }));

    const validCredentials = credentialsToInsert.filter(c => c.service_name && c.username && c.password);
    
    if (validCredentials.length === 0) {
      throw new Error("No valid credentials found");
    }

    const { error } = await supabase.from("credentials").insert(validCredentials);
    if (error) throw error;

    await logActivity("CREATE", "Credential", `Imported ${validCredentials.length} credentials from CSV`);
    fetchCredentials();
  };

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} ${t("vault_copied")}`);
  };

  const filteredCredentials = credentials.filter(
    (cred) =>
      cred.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            {t("vault_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("vault_subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            {t("csv_import_button")}
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                {t("btn_add_credential")}
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                {t("vault_add_title")}
              </DialogTitle>
              <DialogDescription>
                {t("vault_add_description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("vault_service_name")} *</Label>
                <Input
                  placeholder="e.g., AWS Console"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("vault_url")}</Label>
                <Input
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("vault_username")} *</Label>
                <Input
                  placeholder="admin@example.com"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("vault_password")} *</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("vault_category")}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Server">{t("category_server")}</SelectItem>
                    <SelectItem value="Social">{t("category_social")}</SelectItem>
                    <SelectItem value="Hosting">{t("category_hosting")}</SelectItem>
                    <SelectItem value="Cloud">{t("category_cloud")}</SelectItem>
                    <SelectItem value="Database">{t("category_database")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                {t("btn_cancel")}
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("btn_save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* CSV Import Modal */}
      <CsvImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        templateColumns={["service_name", "url", "username", "password", "category"]}
        templateFileName="credentials"
        onImport={handleCsvImport}
        title={t("csv_import_title")}
        description={t("csv_import_description")}
      />

      {/* Security Notice */}
      <div className="glass-card p-4 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{t("vault_security_title")}</p>
            <p className="text-xs text-muted-foreground">{t("vault_security_description")}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("vault_search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Credentials Table */}
      <div className="glass-card overflow-hidden">
        {filteredCredentials.length === 0 ? (
          <div className="p-12 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t("vault_no_credentials")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("vault_no_credentials_desc")}</p>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_add_credential")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">{t("vault_service_name")}</TableHead>
                <TableHead className="text-muted-foreground">{t("vault_url")}</TableHead>
                <TableHead className="text-muted-foreground">{t("vault_username")}</TableHead>
                <TableHead className="text-muted-foreground">{t("vault_password")}</TableHead>
                <TableHead className="text-muted-foreground">{t("vault_category")}</TableHead>
                <TableHead className="text-muted-foreground text-right">{t("vault_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredentials.map((cred) => (
                <TableRow key={cred.id} className="table-row">
                  <TableCell className="font-medium text-foreground">{cred.service_name}</TableCell>
                  <TableCell>
                    {cred.url ? (
                      <a
                        href={cred.url.startsWith("http") ? cred.url : `https://${cred.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-mono text-sm"
                      >
                        {cred.url.length > 30 ? cred.url.substring(0, 30) + "..." : cred.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{cred.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(cred.username, t("vault_username"))}
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">
                        {visiblePasswords.has(cred.id) ? cred.password : "••••••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePasswordVisibility(cred.id)}
                      >
                        {visiblePasswords.has(cred.id) ? (
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(cred.password, t("vault_password"))}
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`status-badge ${categoryColors[cred.category] || categoryColors.Cloud}`}>
                      {cred.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cred.id, cred.service_name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
