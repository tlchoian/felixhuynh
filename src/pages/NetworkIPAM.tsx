import { useState } from "react";
import {
  Plus,
  Search,
  Network,
  Router,
  Wifi,
  Server,
  Camera,
  Monitor,
  Filter,
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

interface NetworkDevice {
  id: number;
  deviceName: string;
  ipAddress: string;
  type: "Router" | "Switch" | "AP" | "Server" | "Camera" | "Workstation";
  macAddress: string;
  location: string;
  vlanId: number;
  status: "Online" | "Offline" | "Maintenance";
}

const mockDevices: NetworkDevice[] = [
  { id: 1, deviceName: "Core-Router-01", ipAddress: "192.168.1.1", type: "Router", macAddress: "00:1A:2B:3C:4D:5E", location: "Branch A - Server Room", vlanId: 1, status: "Online" },
  { id: 2, deviceName: "SW-Floor1-01", ipAddress: "192.168.1.10", type: "Switch", macAddress: "00:1A:2B:3C:4D:5F", location: "Branch A - Floor 1", vlanId: 10, status: "Online" },
  { id: 3, deviceName: "AP-Lobby-01", ipAddress: "192.168.1.50", type: "AP", macAddress: "00:1A:2B:3C:4D:60", location: "Branch A - Lobby", vlanId: 20, status: "Online" },
  { id: 4, deviceName: "SRV-WEB-01", ipAddress: "192.168.1.100", type: "Server", macAddress: "00:1A:2B:3C:4D:61", location: "Branch A - Server Room", vlanId: 100, status: "Online" },
  { id: 5, deviceName: "CAM-Entrance-01", ipAddress: "192.168.1.200", type: "Camera", macAddress: "00:1A:2B:3C:4D:62", location: "Branch A - Entrance", vlanId: 50, status: "Online" },
  { id: 6, deviceName: "Core-Router-02", ipAddress: "192.168.2.1", type: "Router", macAddress: "00:1B:2C:3D:4E:5F", location: "Branch B - Server Room", vlanId: 1, status: "Maintenance" },
  { id: 7, deviceName: "SW-Floor2-01", ipAddress: "192.168.2.10", type: "Switch", macAddress: "00:1B:2C:3D:4E:60", location: "Branch B - Floor 2", vlanId: 10, status: "Offline" },
  { id: 8, deviceName: "AP-Office-01", ipAddress: "192.168.2.50", type: "AP", macAddress: "00:1B:2C:3D:4E:61", location: "Branch B - Office", vlanId: 20, status: "Online" },
  { id: 9, deviceName: "SRV-DB-01", ipAddress: "192.168.1.101", type: "Server", macAddress: "00:1A:2B:3C:4D:63", location: "Branch A - Server Room", vlanId: 100, status: "Online" },
  { id: 10, deviceName: "WS-Reception", ipAddress: "192.168.1.150", type: "Workstation", macAddress: "00:1A:2B:3C:4D:64", location: "Branch A - Reception", vlanId: 30, status: "Online" },
];

const deviceIcons = {
  Router: Router,
  Switch: Network,
  AP: Wifi,
  Server: Server,
  Camera: Camera,
  Workstation: Monitor,
};

const deviceColors = {
  Router: "bg-red-500/20 text-red-400 border-red-500/30",
  Switch: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  AP: "bg-green-500/20 text-green-400 border-green-500/30",
  Server: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Camera: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Workstation: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const statusStyles = {
  Online: "bg-success/20 text-success border-success/30",
  Offline: "bg-destructive/20 text-destructive border-destructive/30",
  Maintenance: "bg-warning/20 text-warning border-warning/30",
};

export default function NetworkIPAM() {
  const [devices] = useState<NetworkDevice[]>(mockDevices);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredDevices = devices
    .filter(
      (device) =>
        device.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.ipAddress.includes(searchQuery) ||
        device.macAddress.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((device) => locationFilter === "all" || device.location.includes(locationFilter))
    .filter((device) => typeFilter === "all" || device.type === typeFilter);

  const onlineCount = devices.filter((d) => d.status === "Online").length;
  const offlineCount = devices.filter((d) => d.status === "Offline").length;
  const locations = [...new Set(devices.map((d) => d.location.split(" - ")[0]))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" />
            Network IPAM
          </h1>
          <p className="text-muted-foreground mt-1">IP Address Management across all branches</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Network className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{devices.length}</p>
              <p className="text-xs text-muted-foreground">Total Devices</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-success/30 bg-success/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/20">
              <Wifi className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{onlineCount}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <Server className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{offlineCount}</p>
              <p className="text-xs text-muted-foreground">Offline</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <Router className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{locations.length}</p>
              <p className="text-xs text-muted-foreground">Branches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, IP, or MAC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <div className="flex gap-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px] input-field">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] input-field">
              <SelectValue placeholder="Device Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Router">Router</SelectItem>
              <SelectItem value="Switch">Switch</SelectItem>
              <SelectItem value="AP">Access Point</SelectItem>
              <SelectItem value="Server">Server</SelectItem>
              <SelectItem value="Camera">Camera</SelectItem>
              <SelectItem value="Workstation">Workstation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Device Name</TableHead>
              <TableHead className="text-muted-foreground">IP Address</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">MAC Address</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">VLAN</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device) => {
              const DeviceIcon = deviceIcons[device.type];
              return (
                <TableRow key={device.id} className="table-row">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                      {device.deviceName}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-primary">{device.ipAddress}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${deviceColors[device.type]}`}>
                      {device.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground uppercase">{device.macAddress}</TableCell>
                  <TableCell className="text-muted-foreground">{device.location}</TableCell>
                  <TableCell className="font-mono text-sm text-foreground">{device.vlanId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        device.status === "Online" ? "bg-success animate-pulse" :
                        device.status === "Offline" ? "bg-destructive" :
                        "bg-warning"
                      }`} />
                      <span className={`status-badge ${statusStyles[device.status]}`}>
                        {device.status}
                      </span>
                    </div>
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
