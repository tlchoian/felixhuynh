import { useState } from "react";
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

interface Contract {
  id: number;
  assetName: string;
  type: "Domain" | "Hosting" | "SSL" | "Software";
  provider: string;
  expiryDate: string;
  daysRemaining: number;
  cost: number;
  billingCycle: "Monthly" | "Yearly";
}

const mockContracts: Contract[] = [
  { id: 1, assetName: "company.com", type: "Domain", provider: "Namecheap", expiryDate: "2025-01-15", daysRemaining: 22, cost: 15.99, billingCycle: "Yearly" },
  { id: 2, assetName: "SSL Certificate - company.com", type: "SSL", provider: "Let's Encrypt", expiryDate: "2025-01-05", daysRemaining: 12, cost: 0, billingCycle: "Yearly" },
  { id: 3, assetName: "VPS Primary - Singapore", type: "Hosting", provider: "DigitalOcean", expiryDate: "2025-02-28", daysRemaining: 66, cost: 48, billingCycle: "Monthly" },
  { id: 4, assetName: "api.company.com", type: "Domain", provider: "Cloudflare", expiryDate: "2024-12-28", daysRemaining: 4, cost: 12.99, billingCycle: "Yearly" },
  { id: 5, assetName: "Microsoft 365 Business", type: "Software", provider: "Microsoft", expiryDate: "2025-03-15", daysRemaining: 81, cost: 12.50, billingCycle: "Monthly" },
  { id: 6, assetName: "Adobe Creative Cloud", type: "Software", provider: "Adobe", expiryDate: "2025-06-20", daysRemaining: 178, cost: 54.99, billingCycle: "Monthly" },
  { id: 7, assetName: "backup.company.com", type: "Domain", provider: "GoDaddy", expiryDate: "2025-01-02", daysRemaining: 9, cost: 18.99, billingCycle: "Yearly" },
  { id: 8, assetName: "Cloudflare Pro", type: "Hosting", provider: "Cloudflare", expiryDate: "2025-04-10", daysRemaining: 107, cost: 25, billingCycle: "Monthly" },
];

const typeIcons = {
  Domain: Globe,
  Hosting: Server,
  SSL: Shield,
  Software: FileText,
};

const typeColors = {
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

export default function ContractMonitor() {
  const [contracts] = useState<Contract[]>(mockContracts);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredContracts = contracts
    .filter(
      (contract) =>
        contract.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.provider.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((contract) => typeFilter === "all" || contract.type === typeFilter)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const expiringCount = contracts.filter((c) => c.daysRemaining <= 30).length;
  const criticalCount = contracts.filter((c) => c.daysRemaining <= 7).length;
  const totalMonthlyCost = contracts.reduce((acc, c) => {
    return acc + (c.billingCycle === "Monthly" ? c.cost : c.cost / 12);
  }, 0);

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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Contract
        </Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.map((contract) => {
              const TypeIcon = typeIcons[contract.type];
              const status = getStatusBadge(contract.daysRemaining);
              return (
                <TableRow key={contract.id} className="table-row">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="w-4 h-4 text-muted-foreground" />
                      {contract.assetName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`status-badge ${typeColors[contract.type]}`}>
                      {contract.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{contract.provider}</TableCell>
                  <TableCell className="font-mono text-sm text-foreground">{contract.expiryDate}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${
                      contract.daysRemaining <= 7 ? 'text-destructive' :
                      contract.daysRemaining <= 30 ? 'text-warning' :
                      'text-success'
                    }`}>
                      {contract.daysRemaining} days
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">
                    ${contract.cost.toFixed(2)}/{contract.billingCycle === "Monthly" ? "mo" : "yr"}
                  </TableCell>
                  <TableCell>
                    <span className={`status-badge ${status.className}`}>
                      {status.label}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
