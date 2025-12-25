import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  Globe,
  Shield,
  Server,
  Calendar,
  DollarSign,
  AlertTriangle,
  Loader2,
  Trash2,
  Pencil,
  Wifi,
  Wrench,
  Package,
  Key,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Badge } from "@/components/ui/badge";

interface Contract {
  id: string;
  asset_name: string;
  type: string;
  provider: string;
  start_date: string | null;
  expiry_date: string;
  cost: number;
  billing_cycle: string;
  status: string;
  notes: string | null;
}

const typeIcons: Record<string, any> = {
  "Domain": Globe,
  "Hosting/VPS": Server,
  "Server Mail": Mail,
  "Software License": Key,
  "Internet/Network": Wifi,
  "Maintenance": Wrench,
  "Other": Package,
};

const typeColors: Record<string, string> = {
  "Domain": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Hosting/VPS": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Server Mail": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "Software License": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Internet/Network": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Maintenance": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Other": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const CONTRACT_TYPES = [
  "Domain",
  "Hosting/VPS",
  "Server Mail",
  "Software License",
  "Internet/Network",
  "Maintenance",
  "Other",
];

const CONTRACT_STATUSES = ["Active", "Expired", "Cancelled"];

function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ContractMonitor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { logActivity } = useActivityLog();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    asset_name: "",
    type: "Domain",
    provider: "",
    start_date: "",
    expiry_date: "",
    cost: "",
    billing_cycle: "Yearly",
    status: "Active",
    notes: "",
  });

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("expiry_date", { ascending: true });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();

    // Set up real-time subscription
    const channel = supabase
      .channel("contracts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          fetchContracts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetFormData = () => {
    setFormData({
      asset_name: "",
      type: "Domain",
      provider: "",
      start_date: "",
      expiry_date: "",
      cost: "",
      billing_cycle: "Yearly",
      status: "Active",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.asset_name || !formData.provider || !formData.expiry_date) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contracts").insert({
        user_id: user?.id,
        asset_name: formData.asset_name,
        type: formData.type,
        provider: formData.provider,
        start_date: formData.start_date || null,
        expiry_date: formData.expiry_date,
        cost: parseFloat(formData.cost) || 0,
        billing_cycle: formData.billing_cycle,
        status: formData.status,
        notes: formData.notes || null,
      });

      if (error) throw error;

      await logActivity("CREATE", "Contract", `${t("logs_contract_added")}: ${formData.asset_name} (${formData.type})`);
      toast.success(t("contracts_added"));
      setIsAddModalOpen(false);
      resetFormData();
    } catch (error) {
      console.error("Error adding contract:", error);
      toast.error("Failed to add contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      asset_name: contract.asset_name,
      type: contract.type,
      provider: contract.provider,
      start_date: contract.start_date || "",
      expiry_date: contract.expiry_date,
      cost: contract.cost.toString(),
      billing_cycle: contract.billing_cycle,
      status: contract.status,
      notes: contract.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingContract || !formData.asset_name || !formData.provider || !formData.expiry_date) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("contracts")
        .update({
          asset_name: formData.asset_name,
          type: formData.type,
          provider: formData.provider,
          start_date: formData.start_date || null,
          expiry_date: formData.expiry_date,
          cost: parseFloat(formData.cost) || 0,
          billing_cycle: formData.billing_cycle,
          status: formData.status,
          notes: formData.notes || null,
        })
        .eq("id", editingContract.id);

      if (error) throw error;

      await logActivity("UPDATE", "Contract", `${t("logs_contract_updated")}: ${formData.asset_name} (${formData.type})`);
      toast.success(t("contracts_updated"));
      setIsEditModalOpen(false);
      setEditingContract(null);
      resetFormData();
    } catch (error) {
      console.error("Error updating contract:", error);
      toast.error("Failed to update contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, assetName: string) => {
    try {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
      await logActivity("DELETE", "Contract", `${t("logs_contract_deleted")}: ${assetName}`);
      toast.success(t("contracts_deleted"));
      fetchContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
    }
  };

  const getExpiryStatusBadge = (daysRemaining: number) => {
    if (daysRemaining <= 7) {
      return { className: "status-danger", label: t("contracts_status_critical") };
    } else if (daysRemaining <= 30) {
      return { className: "status-warning", label: t("contracts_status_expiring") };
    }
    return { className: "status-success", label: t("contracts_status_active") };
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case "Expired":
        return { className: "bg-destructive/20 text-destructive border-destructive/30", label: status };
      case "Cancelled":
        return { className: "bg-muted/50 text-muted-foreground border-muted/30", label: status };
      default:
        return { className: "bg-success/20 text-success border-success/30", label: status };
    }
  };

  const filteredContracts = contracts
    .filter(
      (contract) =>
        contract.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.provider.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((contract) => typeFilter === "all" || contract.type === typeFilter);

  const expiringCount = contracts.filter((c) => getDaysRemaining(c.expiry_date) <= 30).length;
  const criticalCount = contracts.filter((c) => getDaysRemaining(c.expiry_date) <= 7).length;
  const totalMonthlyCost = contracts.reduce((acc, c) => {
    return acc + (c.billing_cycle === "Monthly" ? c.cost : c.cost / 12);
  }, 0);

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
            <FileText className="w-8 h-8 text-primary" />
            {t("contracts_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("contracts_subtitle")}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_add_contract")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("contracts_add_title")}</DialogTitle>
              <DialogDescription>{t("contracts_add_description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("contracts_asset_name")} *</Label>
                <Input
                  placeholder="e.g., Internet Viettel Office, Windows Server 2022 Key"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("contracts_type")}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t("contracts_status")}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {CONTRACT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>{t("contracts_provider")} *</Label>
                <Input
                  placeholder="e.g., Viettel, Pavietnam, Microsoft"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("contracts_start_date")}</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("contracts_expiry_date")} *</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("contracts_cost")} (VND)</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formData.cost ? Number(formData.cost).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                        setFormData({ ...formData, cost: value });
                      }}
                      className="input-field pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">đ</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{t("contracts_billing_cycle")}</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Monthly">{t("billing_monthly")}</SelectItem>
                      <SelectItem value="Yearly">{t("billing_yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>{t("contracts_notes")}</Label>
                <Textarea
                  placeholder="License key, contract code, or additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("btn_cancel")}</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("btn_save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) {
            setEditingContract(null);
            resetFormData();
          }
        }}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("contracts_edit_title")}</DialogTitle>
              <DialogDescription>{t("contracts_edit_description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("contracts_asset_name")} *</Label>
                <Input
                  placeholder="e.g., Internet Viettel Office, Windows Server 2022 Key"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("contracts_type")}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t("contracts_status")}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {CONTRACT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>{t("contracts_provider")} *</Label>
                <Input
                  placeholder="e.g., Viettel, Pavietnam, Microsoft"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("contracts_start_date")}</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("contracts_expiry_date")} *</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("contracts_cost")} (VND)</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formData.cost ? Number(formData.cost).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                        setFormData({ ...formData, cost: value });
                      }}
                      className="input-field pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">đ</span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{t("contracts_billing_cycle")}</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Monthly">{t("billing_monthly")}</SelectItem>
                      <SelectItem value="Yearly">{t("billing_yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>{t("contracts_notes")}</Label>
                <Textarea
                  placeholder="License key, contract code, or additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t("btn_cancel")}</Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-primary text-primary-foreground">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("btn_save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{contracts.length}</p>
              <p className="text-xs text-muted-foreground">{t("contracts_total")}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Calendar className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{expiringCount}</p>
              <p className="text-xs text-muted-foreground">{t("contracts_expiring_30")}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">{t("contracts_critical")}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalMonthlyCost.toLocaleString('vi-VN')} đ</p>
              <p className="text-xs text-muted-foreground">{t("contracts_monthly_cost")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("contracts_search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] input-field">
            <SelectValue placeholder={t("contracts_filter_type")} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">{t("all_types")}</SelectItem>
            {CONTRACT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contracts Table */}
      <div className="glass-card overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t("contracts_no_contracts")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("contracts_no_contracts_desc")}</p>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_add_contract")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">{t("contracts_asset_name")}</TableHead>
                <TableHead className="text-muted-foreground">{t("contracts_type")}</TableHead>
                <TableHead className="text-muted-foreground">{t("contracts_provider")}</TableHead>
                <TableHead className="text-muted-foreground">{t("contracts_expiry_date")}</TableHead>
                <TableHead className="text-muted-foreground">{t("contracts_days_left")}</TableHead>
                <TableHead className="text-muted-foreground">{t("contracts_cost")}</TableHead>
                <TableHead className="text-muted-foreground">{t("contracts_status")}</TableHead>
                <TableHead className="text-muted-foreground text-right">{t("vault_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const TypeIcon = typeIcons[contract.type] || FileText;
                const daysRemaining = getDaysRemaining(contract.expiry_date);
                const expiryStatus = getExpiryStatusBadge(daysRemaining);
                const contractStatus = getContractStatusBadge(contract.status);
                return (
                  <TableRow key={contract.id} className="table-row">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        {contract.asset_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${typeColors[contract.type] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                        {contract.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contract.provider}</TableCell>
                    <TableCell>
                      <span className={`font-mono text-sm ${
                        daysRemaining <= 7 ? "text-destructive font-bold" :
                        daysRemaining <= 30 ? "text-warning font-semibold" :
                        "text-foreground"
                      }`}>
                        {contract.expiry_date}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        daysRemaining <= 7 ? "text-destructive" :
                        daysRemaining <= 30 ? "text-warning" :
                        "text-success"
                      }`}>
                        {daysRemaining} {t("contracts_days")}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {contract.cost.toLocaleString('vi-VN')} đ/{contract.billing_cycle === "Monthly" ? "tháng" : "năm"}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${contractStatus.className}`}>
                        {contractStatus.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(contract)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(contract.id, contract.asset_name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
