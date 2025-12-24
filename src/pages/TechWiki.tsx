import { useState } from "react";
import {
  BookOpen,
  Search,
  FileText,
  ChevronRight,
  Plus,
  Clock,
  User,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WikiArticle {
  id: number;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
  author: string;
}

const mockArticles: WikiArticle[] = [
  {
    id: 1,
    title: "Ubuntu Server Initial Setup",
    category: "Linux",
    content: `# Ubuntu Server Initial Setup Guide

## Prerequisites
- Fresh Ubuntu 22.04 LTS installation
- Root or sudo access
- SSH access configured

## Step 1: Update System Packages

\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

## Step 2: Configure Firewall

\`\`\`bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
\`\`\`

## Step 3: Create Admin User

\`\`\`bash
adduser admin
usermod -aG sudo admin
\`\`\`

## Step 4: Configure SSH Security

Edit /etc/ssh/sshd_config:

\`\`\`bash
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
\`\`\`

Restart SSH service:

\`\`\`bash
sudo systemctl restart sshd
\`\`\`

## Next Steps
- Install required services
- Configure monitoring
- Set up automatic updates`,
    lastUpdated: "2024-12-20",
    author: "IT Admin",
  },
  {
    id: 2,
    title: "Zabbix Configuration Guide",
    category: "Monitoring",
    content: `# Zabbix Server Configuration

## Installation

### Add Zabbix Repository

\`\`\`bash
wget https://repo.zabbix.com/zabbix/6.4/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.4-1+ubuntu22.04_all.deb
sudo dpkg -i zabbix-release_6.4-1+ubuntu22.04_all.deb
sudo apt update
\`\`\`

### Install Zabbix Components

\`\`\`bash
sudo apt install zabbix-server-mysql zabbix-frontend-php zabbix-apache-conf zabbix-sql-scripts zabbix-agent
\`\`\`

## Database Setup

\`\`\`sql
CREATE DATABASE zabbix CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
CREATE USER 'zabbix'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zabbix.* TO 'zabbix'@'localhost';
\`\`\`

## Common Templates to Import
- Linux servers
- Windows servers
- Network devices (SNMP)`,
    lastUpdated: "2024-12-18",
    author: "Network Admin",
  },
  {
    id: 3,
    title: "Router Reset Procedure",
    category: "Networking",
    content: `# Router Factory Reset Guide

## Cisco Routers

### Via Console

\`\`\`
enable
erase startup-config
reload
\`\`\`

### Hardware Reset
1. Locate the reset button (usually recessed)
2. Power on the router
3. Hold reset for 15 seconds
4. Release when LEDs flash

## MikroTik Routers

### Via WinBox
1. System → Reset Configuration
2. Check "No Default Configuration"
3. Click Reset

### Via CLI

\`\`\`
/system reset-configuration no-defaults=yes
\`\`\`

## Post-Reset Checklist
- [ ] Update firmware
- [ ] Configure management IP
- [ ] Set admin password
- [ ] Configure NTP
- [ ] Enable logging`,
    lastUpdated: "2024-12-15",
    author: "IT Admin",
  },
  {
    id: 4,
    title: "Backup Strategy Guide",
    category: "Best Practices",
    content: `# Backup Best Practices

## 3-2-1 Backup Rule
- 3 copies of data
- 2 different media types
- 1 offsite location

## Recommended Tools
- Veeam Backup
- rsync for Linux
- Windows Server Backup

## Backup Schedule Template

| Type | Frequency | Retention |
|------|-----------|-----------|
| Full | Weekly | 4 weeks |
| Incremental | Daily | 7 days |
| Differential | Weekly | 2 weeks |`,
    lastUpdated: "2024-12-10",
    author: "IT Admin",
  },
  {
    id: 5,
    title: "VPN Setup - WireGuard",
    category: "Security",
    content: `# WireGuard VPN Configuration

## Server Installation

\`\`\`bash
sudo apt install wireguard
cd /etc/wireguard
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
\`\`\`

## Server Config (/etc/wireguard/wg0.conf)

\`\`\`ini
[Interface]
PrivateKey = <server_private_key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <client_public_key>
AllowedIPs = 10.0.0.2/32
\`\`\``,
    lastUpdated: "2024-12-22",
    author: "Security Admin",
  },
];

const categories = [...new Set(mockArticles.map((a) => a.category))];

export default function TechWiki() {
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle>(mockArticles[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering for display
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-2xl font-bold text-foreground mt-6 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-xl font-semibold text-foreground mt-5 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-lg font-medium text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith("```")) {
          return null;
        }
        if (line.startsWith("- ")) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line.startsWith("| ")) {
          return <p key={i} className="font-mono text-sm text-muted-foreground">{line}</p>;
        }
        if (line.trim() === "") {
          return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground my-1">{line}</p>;
      });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Tech Wiki
          </h1>
          <p className="text-muted-foreground mt-1">IT Documentation & Knowledge Base</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Main Layout */}
      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-field"
            />
          </div>

          {/* Categories */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  !selectedCategory && "bg-primary/20 text-primary"
                )}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 text-xs",
                    selectedCategory === cat && "bg-primary/20 text-primary"
                  )}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Articles List */}
          <ScrollArea className="glass-card h-[calc(100%-160px)]">
            <div className="p-2 space-y-1">
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                    selectedArticle.id === article.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <FileText className={cn(
                    "w-4 h-4 flex-shrink-0",
                    selectedArticle.id === article.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      selectedArticle.id === article.id ? "text-primary" : "text-foreground"
                    )}>
                      {article.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{article.category}</p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-auto flex-shrink-0",
                    selectedArticle.id === article.id ? "text-primary" : "text-muted-foreground"
                  )} />
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          {/* Article Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-start justify-between">
              <div>
                <span className="status-badge bg-primary/20 text-primary border-primary/30 mb-2 inline-block">
                  {selectedArticle.category}
                </span>
                <h2 className="text-2xl font-bold text-foreground">{selectedArticle.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {selectedArticle.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated: {selectedArticle.lastUpdated}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          {/* Article Content */}
          <ScrollArea className="flex-1 p-6">
            <div className="prose prose-invert max-w-none">
              {renderMarkdown(selectedArticle.content)}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
