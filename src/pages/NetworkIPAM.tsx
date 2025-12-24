import { useState, useEffect } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityLog } from "@/hooks/useActivityLog";

interface NetworkDevice {
  id: string;
  device_name: string;
  ip_address: string;
  type: string;
  mac_address: string | null;
  location: string;
  vlan_id: number | null;
  status: string;
}

const deviceIcons: Record<string, any> = {
  Router: Router,
  Switch: Network,
  AP: Wifi,
  Server: Server,
  Camera: Camera,
  Workstation: Monitor,
};

const deviceColors: Record<string, string> = {
  Router: "bg-red-500/20 text-red-400 border-red-500/30",
  Switch: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  AP: "bg-green-500/20 text-green-400 border-green-500/30",
  Server: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Camera: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Workstation: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const statusStyles: Record<string, string> = {
  Online: "bg-success/20 text-success border-success/30",
  Offline: "bg-destructive/20 text-destructive border-destructive/30",
  Maintenance: "bg-warning/20 text-warning border-warning/30",
};

export default function NetworkIPAM() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { logActivity } = useActivityLog();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    device_name: "",
    ip_address: "",
    type: "Workstation",
    mac_address: "",
    location: "",
    vlan_id: "1",
    status: "Online",
  });

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("network_devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast.error("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleSubmit = async () => {
    if (!formData.device_name || !formData.ip_address || !formData.location) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("network_devices").insert({
        user_id: user?.id,
        device_name: formData.device_name,
        ip_address: formData.ip_address,
        type: formData.type,
        mac_address: formData.mac_address || null,
        location: formData.location,
        vlan_id: parseInt(formData.vlan_id) || 1,
        status: formData.status,
      });

      if (error) throw error;

      await logActivity("CREATE", "Device", `${t("logs_device_added")}: ${formData.device_name} (${formData.ip_address})`);
      toast.success(t("network_device_added"));
      setIsAddModalOpen(false);
      setFormData({ device_name: "", ip_address: "", type: "Workstation", mac_address: "", location: "", vlan_id: "1", status: "Online" });
      fetchDevices();
    } catch (error) {
      console.error("Error adding device:", error);
      toast.error("Failed to add device");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, deviceName: string) => {
    try {
      const { error } = await supabase.from("network_devices").delete().eq("id", id);
      if (error) throw error;
      await logActivity("DELETE", "Device", `${t("logs_device_deleted")}: ${deviceName}`);
      toast.success(t("network_device_deleted"));
      fetchDevices();
    } catch (error) {
      console.error("Error deleting device:", error);
      toast.error("Failed to delete device");
    }
  };

  const locations = [...new Set(devices.map((d) => d.location))];

  const filteredDevices = devices
    .filter(
      (device) =>
        device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.ip_address.includes(searchQuery) ||
        (device.mac_address && device.mac_address.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter((device) => locationFilter === "all" || device.location === locationFilter)
    .filter((device) => typeFilter === "all" || device.type === typeFilter);

  const onlineCount = devices.filter((d) => d.status === "Online").length;
  const offlineCount = devices.filter((d) => d.status === "Offline").length;

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
            <Network className="w-8 h-8 text-primary" />
            {t("network_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("network_subtitle")}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_add_device")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{t("network_add_title")}</DialogTitle>
              <DialogDescription>{t("network_add_description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("network_device_name")} *</Label>
                <Input
                  placeholder="e.g., SW-Floor1-01"
                  value={formData.device_name}
                  onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("network_ip_address")} *</Label>
                  <Input
                    placeholder="192.168.1.1"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("network_type")}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Router">{t("device_router")}</SelectItem>
                      <SelectItem value="Switch">{t("device_switch")}</SelectItem>
                      <SelectItem value="AP">{t("device_ap")}</SelectItem>
                      <SelectItem value="Server">{t("device_server")}</SelectItem>
                      <SelectItem value="Camera">{t("device_camera")}</SelectItem>
                      <SelectItem value="Workstation">{t("device_workstation")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t("network_mac_address")}</Label>
                <Input
                  placeholder="00:1A:2B:3C:4D:5E"
                  value={formData.mac_address}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("network_location")} *</Label>
                <Input
                  placeholder="Branch A - Server Room"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("network_vlan")}</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={formData.vlan_id}
                    onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("network_status")}</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="Online">{t("status_online")}</SelectItem>
                      <SelectItem value="Offline">{t("status_offline")}</SelectItem>
                      <SelectItem value="Maintenance">{t("status_maintenance")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <p className="text-xs text-muted-foreground">{t("network_total_devices")}</p>
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
              <p className="text-xs text-muted-foreground">{t("network_online")}</p>
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
              <p className="text-xs text-muted-foreground">{t("network_offline")}</p>
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
              <p className="text-xs text-muted-foreground">{t("network_locations")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("network_search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <div className="flex gap-2">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px] input-field">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t("network_filter_location")} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t("network_filter_location")}</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] input-field">
              <SelectValue placeholder={t("network_filter_type")} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t("network_filter_type")}</SelectItem>
              <SelectItem value="Router">{t("device_router")}</SelectItem>
              <SelectItem value="Switch">{t("device_switch")}</SelectItem>
              <SelectItem value="AP">{t("device_ap")}</SelectItem>
              <SelectItem value="Server">{t("device_server")}</SelectItem>
              <SelectItem value="Camera">{t("device_camera")}</SelectItem>
              <SelectItem value="Workstation">{t("device_workstation")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Devices Table */}
      <div className="glass-card overflow-hidden">
        {filteredDevices.length === 0 ? (
          <div className="p-12 text-center">
            <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t("network_no_devices")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("network_no_devices_desc")}</p>
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_add_device")}
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">{t("network_device_name")}</TableHead>
                <TableHead className="text-muted-foreground">{t("network_ip_address")}</TableHead>
                <TableHead className="text-muted-foreground">{t("network_type")}</TableHead>
                <TableHead className="text-muted-foreground">{t("network_mac_address")}</TableHead>
                <TableHead className="text-muted-foreground">{t("network_location")}</TableHead>
                <TableHead className="text-muted-foreground">{t("network_vlan")}</TableHead>
                <TableHead className="text-muted-foreground">{t("network_status")}</TableHead>
                <TableHead className="text-muted-foreground text-right">{t("vault_actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map((device) => {
                const DeviceIcon = deviceIcons[device.type] || Monitor;
                return (
                  <TableRow key={device.id} className="table-row">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                        {device.device_name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-primary">{device.ip_address}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${deviceColors[device.type] || ""}`}>
                        {device.type}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground uppercase">
                      {device.mac_address || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{device.location}</TableCell>
                    <TableCell className="font-mono text-sm text-foreground">{device.vlan_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          device.status === "Online" ? "bg-success animate-pulse" :
                          device.status === "Offline" ? "bg-destructive" :
                          "bg-warning"
                        }`} />
                        <span className={`status-badge ${statusStyles[device.status] || ""}`}>
                          {device.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(device.id, device.device_name)}
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
