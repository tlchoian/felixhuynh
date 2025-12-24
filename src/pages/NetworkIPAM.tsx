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
  List,
  GitBranch,
  Upload,
  Pencil,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { NetworkTopology } from "@/components/network/NetworkTopology";
import { CsvImportModal } from "@/components/CsvImportModal";

interface NetworkDevice {
  id: string;
  device_name: string;
  ip_address: string;
  type: string;
  mac_address: string | null;
  location: string;
  vlan_id: number | null;
  status: string;
  uplink_device_id: string | null;
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
  const [viewMode, setViewMode] = useState<"list" | "topology">("list");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [editFormData, setEditFormData] = useState({
    device_name: "",
    ip_address: "",
    type: "Workstation",
    mac_address: "",
    location: "",
    vlan_id: "1",
    status: "Online",
    uplink_device_id: "",
  });

  const [formData, setFormData] = useState({
    device_name: "",
    ip_address: "",
    type: "Workstation",
    mac_address: "",
    location: "",
    vlan_id: "1",
    status: "Online",
    uplink_device_id: "",
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
        uplink_device_id: formData.uplink_device_id || null,
      });

      if (error) throw error;

      await logActivity("CREATE", "Device", `${t("logs_device_added")}: ${formData.device_name} (${formData.ip_address})`);
      toast.success(t("network_device_added"));
      setIsAddModalOpen(false);
      setFormData({ device_name: "", ip_address: "", type: "Workstation", mac_address: "", location: "", vlan_id: "1", status: "Online", uplink_device_id: "" });
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

  const handleCsvImport = async (data: Record<string, string>[]) => {
    const devicesToInsert = data.map((row) => ({
      user_id: user?.id,
      device_name: row.device_name || row["Device Name"] || "",
      ip_address: row.ip_address || row["IP Address"] || "",
      type: row.type || row["Type"] || "Workstation",
      mac_address: row.mac_address || row["MAC Address"] || null,
      location: row.location || row["Location"] || "",
      vlan_id: parseInt(row.vlan_id || row["VLAN"] || "1") || 1,
      status: row.status || row["Status"] || "Online",
    }));

    const validDevices = devicesToInsert.filter(d => d.device_name && d.ip_address && d.location);
    
    if (validDevices.length === 0) {
      throw new Error("No valid devices found");
    }

    const { error } = await supabase.from("network_devices").insert(validDevices);
    if (error) throw error;

    await logActivity("CREATE", "Device", `Imported ${validDevices.length} devices from CSV`);
    fetchDevices();
  };

  const handleEdit = (device: NetworkDevice) => {
    setEditingDevice(device);
    setEditFormData({
      device_name: device.device_name,
      ip_address: device.ip_address,
      type: device.type,
      mac_address: device.mac_address || "",
      location: device.location,
      vlan_id: device.vlan_id?.toString() || "1",
      status: device.status,
      uplink_device_id: device.uplink_device_id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingDevice || !editFormData.device_name || !editFormData.ip_address || !editFormData.location) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("network_devices")
        .update({
          device_name: editFormData.device_name,
          ip_address: editFormData.ip_address,
          type: editFormData.type,
          mac_address: editFormData.mac_address || null,
          location: editFormData.location,
          vlan_id: parseInt(editFormData.vlan_id) || 1,
          status: editFormData.status,
          uplink_device_id: editFormData.uplink_device_id || null,
        })
        .eq("id", editingDevice.id);

      if (error) throw error;

      await logActivity("UPDATE", "Device", `${t("logs_device_updated")}: ${editFormData.device_name}`);
      toast.success(t("network_device_updated"));
      setIsEditModalOpen(false);
      setEditingDevice(null);
      fetchDevices();
    } catch (error) {
      console.error("Error updating device:", error);
      toast.error("Failed to update device");
    } finally {
      setIsSubmitting(false);
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

  // Get available uplink devices (exclude the current device if editing)
  const availableUplinkDevices = devices.filter(d => 
    ["Router", "Switch", "AP", "Server"].includes(d.type)
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
            <Network className="w-8 h-8 text-primary" />
            {t("network_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("network_subtitle")}</p>
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
                {t("btn_add_device")}
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
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
              {/* Uplink Device Dropdown */}
              <div className="grid gap-2">
                <Label>{t("network_uplink_device")}</Label>
                <Select 
                  value={formData.uplink_device_id} 
                  onValueChange={(value) => setFormData({ ...formData, uplink_device_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder={t("network_uplink_none")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">{t("network_uplink_none")}</SelectItem>
                    {availableUplinkDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.device_name} ({device.ip_address})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
      </div>

      {/* CSV Import Modal */}
      <CsvImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        templateColumns={["device_name", "ip_address", "type", "mac_address", "location", "vlan_id", "status"]}
        templateFileName="network_devices"
        onImport={handleCsvImport}
        title={t("csv_import_title")}
        description={t("csv_import_description")}
      />

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

      {/* View Toggle & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
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
        
        {/* View Toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "topology")} className="shrink-0">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="list" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="w-4 h-4" />
              {t("network_view_list")}
            </TabsTrigger>
            <TabsTrigger value="topology" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <GitBranch className="w-4 h-4" />
              {t("network_view_topology")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on view mode */}
      {viewMode === "topology" ? (
        <NetworkTopology devices={filteredDevices} />
      ) : (
        /* Devices Table */
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
                  <TableHead className="text-muted-foreground">{t("network_uplink_device")}</TableHead>
                  <TableHead className="text-muted-foreground">{t("network_status")}</TableHead>
                  <TableHead className="text-muted-foreground text-right">{t("vault_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device) => {
                  const DeviceIcon = deviceIcons[device.type] || Monitor;
                  const uplinkDevice = devices.find(d => d.id === device.uplink_device_id);
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
                        <span className={`px-2 py-1 rounded-full text-xs border ${deviceColors[device.type]}`}>
                          {t(`device_${device.type.toLowerCase()}` as any) || device.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{device.mac_address || "-"}</TableCell>
                      <TableCell className="text-foreground">{device.location}</TableCell>
                      <TableCell className="text-muted-foreground">{device.vlan_id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {uplinkDevice ? (
                          <span className="text-sm">{uplinkDevice.device_name}</span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs border ${statusStyles[device.status]}`}>
                          {t(`status_${device.status.toLowerCase()}` as any) || device.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(device)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(device.id, device.device_name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
      )}

      {/* Edit Device Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("network_edit_title")}</DialogTitle>
            <DialogDescription>{t("network_edit_description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("network_device_name")} *</Label>
              <Input
                placeholder="e.g., SW-Floor1-01"
                value={editFormData.device_name}
                onChange={(e) => setEditFormData({ ...editFormData, device_name: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("network_ip_address")} *</Label>
                <Input
                  placeholder="192.168.1.1"
                  value={editFormData.ip_address}
                  onChange={(e) => setEditFormData({ ...editFormData, ip_address: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("network_type")}</Label>
                <Select value={editFormData.type} onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}>
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
                value={editFormData.mac_address}
                onChange={(e) => setEditFormData({ ...editFormData, mac_address: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("network_location")} *</Label>
              <Input
                placeholder="Branch A - Server Room"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("network_vlan")}</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={editFormData.vlan_id}
                  onChange={(e) => setEditFormData({ ...editFormData, vlan_id: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("network_status")}</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
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
            {/* Uplink Device Dropdown */}
            <div className="grid gap-2">
              <Label>{t("network_uplink_device")}</Label>
              <Select 
                value={editFormData.uplink_device_id || "none"} 
                onValueChange={(value) => setEditFormData({ ...editFormData, uplink_device_id: value === "none" ? "" : value })}
              >
                <SelectTrigger className="input-field">
                  <SelectValue placeholder={t("network_uplink_none")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">{t("network_uplink_none")}</SelectItem>
                  {devices.filter(d => d.id !== editingDevice?.id && ["Router", "Switch", "AP", "Server"].includes(d.type)).map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.device_name} ({device.ip_address})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>{t("btn_cancel")}</Button>
            <Button onClick={handleEditSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("btn_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
