import { useState } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Search,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  Shield,
  Lock,
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

interface Credential {
  id: number;
  serviceName: string;
  url: string;
  username: string;
  password: string;
  category: "Server" | "Social" | "Hosting" | "Cloud" | "Database";
}

const mockCredentials: Credential[] = [
  { id: 1, serviceName: "AWS Console", url: "https://aws.amazon.com/console", username: "admin@company.com", password: "Str0ngP@ssw0rd!", category: "Cloud" },
  { id: 2, serviceName: "GitHub Enterprise", url: "https://github.com/enterprise", username: "dev-admin", password: "GitH@b2024!Secure", category: "Cloud" },
  { id: 3, serviceName: "cPanel - Main Server", url: "https://server1.hosting.com:2083", username: "root", password: "Cpanel#Root$2024", category: "Hosting" },
  { id: 4, serviceName: "MySQL Production", url: "192.168.1.100:3306", username: "db_admin", password: "MySQL@Prod!2024", category: "Database" },
  { id: 5, serviceName: "Proxmox VE", url: "https://pve.internal:8006", username: "root@pam", password: "Pr0xm0x!VE#2024", category: "Server" },
  { id: 6, serviceName: "LinkedIn Company", url: "https://linkedin.com", username: "marketing@company.com", password: "L1nked!n2024Mkt", category: "Social" },
  { id: 7, serviceName: "DigitalOcean", url: "https://cloud.digitalocean.com", username: "devops@company.com", password: "D0cean$ecure!24", category: "Cloud" },
  { id: 8, serviceName: "Cloudflare", url: "https://dash.cloudflare.com", username: "it@company.com", password: "Cl0udfl@re!2024", category: "Hosting" },
];

const categoryColors = {
  Server: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Social: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  Hosting: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Cloud: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Database: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function CredentialVault() {
  const [credentials] = useState<Credential[]>(mockCredentials);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const togglePasswordVisibility = (id: number) => {
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
    toast.success(`${type} copied to clipboard`);
  };

  const filteredCredentials = credentials.filter(
    (cred) =>
      cred.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Credential Vault
          </h1>
          <p className="text-muted-foreground mt-1">Securely manage all your authentication credentials</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Add New Credential
              </DialogTitle>
              <DialogDescription>
                Add a new credential to your secure vault.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="serviceName">Service Name</Label>
                <Input id="serviceName" placeholder="e.g., AWS Console" className="input-field" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" placeholder="https://..." className="input-field" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="admin@example.com" className="input-field" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="input-field" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="hosting">Hosting</SelectItem>
                    <SelectItem value="cloud">Cloud</SelectItem>
                    <SelectItem value="database">Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground">Save Credential</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Notice */}
      <div className="glass-card p-4 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">End-to-End Encryption</p>
            <p className="text-xs text-muted-foreground">All credentials are encrypted using AES-256 before storage</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by service, username, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 input-field"
        />
      </div>

      {/* Credentials Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Service Name</TableHead>
              <TableHead className="text-muted-foreground">URL</TableHead>
              <TableHead className="text-muted-foreground">Username</TableHead>
              <TableHead className="text-muted-foreground">Password</TableHead>
              <TableHead className="text-muted-foreground">Category</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCredentials.map((cred) => (
              <TableRow key={cred.id} className="table-row">
                <TableCell className="font-medium text-foreground">{cred.serviceName}</TableCell>
                <TableCell>
                  <a
                    href={cred.url.startsWith("http") ? cred.url : `https://${cred.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-mono text-sm"
                  >
                    {cred.url.length > 30 ? cred.url.substring(0, 30) + "..." : cred.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{cred.username}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(cred.username, "Username")}
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
                      onClick={() => copyToClipboard(cred.password, "Password")}
                    >
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`status-badge ${categoryColors[cred.category]}`}>
                    {cred.category}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
