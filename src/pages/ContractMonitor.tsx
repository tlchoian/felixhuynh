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

interface Contract {
  id: string;
  asset_name: string;
  type: string;
  provider: string;
  expiry_date: string;
  cost: number;
  billing_cycle: string;
}

const typeIcons: Record<string, any> = {
  Domain: Globe,
  Hosting: Server,
  SSL: Shield,
  Software: FileText,
};

const typeColors: Record<string, string> = {
  Domain: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Hosting: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  SSL: "bg-green-500/20 text-green-400 border-green-500/30",
  Software: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

function getStatusBadge(daysRemaining: number) {
  if (daysRemaining <= 7) {
    return { className: "status-danger", label: "Critical" };
  } else if (daysRemaining <= 30) {
    return { className: "status-warning", label: "Expiring Soon" };
  }
  return { className: "status-success", label: "Active" };
}

function getDaysRemaining(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ContractMonitor() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    asset_name: "",
    type: "Domain",
    provider: "",
    expiry_date: "",
    cost: "",
    billing_cycle: "Yearly",
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
  }, []);

  const handleSubmit = async () => {
    if (!formData.asset_name || !formData.provider || !formData.expiry_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contracts").insert({
        user_id: user?.id,
        asset_name: formData.asset_name,
        type: formData.type,
        provider: formData.provider,
        expiry_date: formData.expiry_date,
        cost: parseFloat(formData.cost) || 0,
        billing_cycle: formData.billing_cycle,
      });

      if (error) throw error;

      toast.success("Contract added successfully");
      setIsAddModalOpen(false);
      setFormData({ asset_name: "", type: "Domain", provider: "", expiry_date: "", cost: "", billing_cycle: "Yearly" });
      fetchContracts();
    } catch (error) {
      console.error("Error adding contract:", error);
      toast.error("Failed to add contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Contract deleted");
      fetchContracts();
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Failed to delete contract");
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
            Contract & License Monitor
          </h1>
          <p className="text-muted-foreground mt-1">Track domains, hosting, SSL certificates, and software licenses</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add New Contract</DialogTitle>
              <DialogDescription>Add a new contract or license to track.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Asset Name *</Label>
                <Input
                  placeholder="e.g., company.com"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="Domain">Domain</SelectItem>
                    <SelectItem value="Hosting">Hosting</SelectItem>
                    <SelectItem value="SSL">SSL</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Provider *</Label>
                <Input
                  placeholder="e.g., Namecheap"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Billing Cycle</Label>
                  <Select value={formData.billing_cycle} onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Contract
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
              <p className="text-xs text-muted-foreground">Total Contracts</p>
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
              <p className="text-xs text-muted-foreground">Expiring in 30 Days</p>
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
              <p className="text-xs text-muted-foreground">Critical (≤7 Days)</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${totalMonthlyCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Est. Monthly Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] input-field">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Domain">Domain</SelectItem>
            <SelectItem value="Hosting">Hosting</SelectItem>
            <SelectItem value="SSL">SSL</SelectItem>
            <SelectItem value="Software">Software</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts Table */}
      <div className="glass-card overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No contracts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first contract to start tracking</p>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Contract
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Asset Name</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Provider</TableHead>
                <TableHead className="text-muted-foreground">Expiry Date</TableHead>
                <TableHead className="text-muted-foreground">Days Left</TableHead>
                <TableHead className="text-muted-foreground">Cost</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const TypeIcon = typeIcons[contract.type] || FileText;
                const daysRemaining = getDaysRemaining(contract.expiry_date);
                const status = getStatusBadge(daysRemaining);
                return (
                  <TableRow key={contract.id} className="table-row">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        {contract.asset_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${typeColors[contract.type] || ""}`}>
                        {contract.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{contract.provider}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{contract.expiry_date}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${
                        daysRemaining <= 7 ? 'text-destructive' :
                        daysRemaining <= 30 ? 'text-warning' :
                        'text-success'
                      }`}>
                        {daysRemaining} days
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      ${contract.cost.toFixed(2)}/{contract.billing_cycle === "Monthly" ? "mo" : "yr"}
                    </TableCell>
                    <TableCell>
                      <span className={`status-badge ${status.className}`}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
