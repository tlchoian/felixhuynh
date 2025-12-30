import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Network,
  Router,
  Wifi,
  Server,
  Camera,
  Monitor,
  Tv,
  Filter,
  Loader2,
  Trash2,
  List,
  GitBranch,
  Upload,
  Pencil,
  MapPin,
  FileDown,
  Wand2,
  Copy,
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
import { NetworkTopology, NetworkTopologyHandle } from "@/components/network/NetworkTopology";
import { CsvImportModal } from "@/components/CsvImportModal";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useVlanSchemas, calculateNextAvailableIp, VlanSchema } from "@/hooks/useVlanSchemas";

interface Location {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
}

interface NetworkDevice {
  id: string;
  device_name: string;
  ip_address: string;
  type: string;
  mac_address: string | null;
  location: string;
  location_id: string | null;
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
  IPTV: Tv,
};

const deviceColors: Record<string, string> = {
  Router: "bg-red-500/20 text-red-400 border-red-500/30",
  Switch: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  AP: "bg-green-500/20 text-green-400 border-green-500/30",
  Server: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Camera: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Workstation: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  IPTV: "bg-pink-500/20 text-pink-400 border-pink-500/30",
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
  const { vlanSchemas } = useVlanSchemas();
  const topologyRef = useRef<NetworkTopologyHandle>(null);
  const topologyContainerRef = useRef<HTMLDivElement>(null);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "topology">("list");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [editFormData, setEditFormData] = useState({
    device_name: "",
    ip_address: "",
    gateway: "",
    type: "Workstation",
    mac_address: "",
    location_id: "",
    vlan_id: "",
    status: "Online",
    uplink_device_id: "",
  });

  const [formData, setFormData] = useState({
    device_name: "",
    ip_address: "",
    gateway: "",
    type: "Workstation",
    mac_address: "",
    location_id: "",
    vlan_id: "",
    status: "Online",
    uplink_device_id: "",
  });

  // Handle VLAN selection and auto-fill IP/gateway
  const handleVlanChange = (vlanIdString: string, isEditForm: boolean = false) => {
    const vlanId = parseInt(vlanIdString);
    const selectedVlan = vlanSchemas.find((v) => v.vlan_id === vlanId);
    
    if (selectedVlan) {
      const suggestedIp = calculateNextAvailableIp(selectedVlan, devices);
      
      if (isEditForm) {
        setEditFormData((prev) => ({
          ...prev,
          vlan_id: vlanIdString,
          ip_address: suggestedIp,
          gateway: selectedVlan.gateway,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          vlan_id: vlanIdString,
          ip_address: suggestedIp,
          gateway: selectedVlan.gateway,
        }));
      }
    } else {
      if (isEditForm) {
        setEditFormData((prev) => ({ ...prev, vlan_id: vlanIdString }));
      } else {
        setFormData((prev) => ({ ...prev, vlan_id: vlanIdString }));
      }
    }
  };

  // Manual IP suggestion trigger
  const suggestNextIp = (isEditForm: boolean = false) => {
    const currentVlanId = isEditForm ? editFormData.vlan_id : formData.vlan_id;
    if (!currentVlanId) return;
    
    const vlanId = parseInt(currentVlanId);
    const selectedVlan = vlanSchemas.find((v) => v.vlan_id === vlanId);
    
    if (selectedVlan) {
      const suggestedIp = calculateNextAvailableIp(selectedVlan, devices);
      if (isEditForm) {
        setEditFormData((prev) => ({ ...prev, ip_address: suggestedIp }));
      } else {
        setFormData((prev) => ({ ...prev, ip_address: suggestedIp }));
      }
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

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
    Promise.all([fetchLocations(), fetchDevices()]);
  }, []);

  const handleSubmit = async (keepModalOpen: boolean = false) => {
    if (!formData.device_name || !formData.ip_address || !formData.location_id) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedLocation = locations.find(l => l.id === formData.location_id);
      const { error } = await supabase.from("network_devices").insert({
        user_id: user?.id,
        device_name: formData.device_name,
        ip_address: formData.ip_address,
        type: formData.type,
        mac_address: formData.mac_address || null,
        location: selectedLocation?.name || "",
        location_id: formData.location_id,
        vlan_id: parseInt(formData.vlan_id) || 1,
        status: formData.status,
        uplink_device_id: formData.uplink_device_id || null,
      });

      if (error) throw error;

      await logActivity("CREATE", "Device", `${t("logs_device_added")}: ${formData.device_name} (${formData.ip_address})`);
      toast.success(t("network_device_added"));
      
      // Fetch updated devices list first to get accurate next IP
      const { data: updatedDevices } = await supabase
        .from("network_devices")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (updatedDevices) {
        setDevices(updatedDevices);
      }
      
      if (keepModalOpen) {
        // Keep context (VLAN, Location, Type, Uplink) but clear Name/MAC and suggest next IP
        const currentVlanId = formData.vlan_id;
        const selectedVlan = vlanSchemas.find((v) => v.vlan_id === parseInt(currentVlanId));
        const nextIp = selectedVlan 
          ? calculateNextAvailableIp(selectedVlan, updatedDevices || devices)
          : "";
        
        setFormData((prev) => ({
          ...prev,
          device_name: "",
          mac_address: "",
          ip_address: nextIp,
        }));
      } else {
        setIsAddModalOpen(false);
        setFormData({ device_name: "", ip_address: "", gateway: "", type: "Workstation", mac_address: "", location_id: "", vlan_id: "", status: "Online", uplink_device_id: "" });
      }
    } catch (error) {
      console.error("Error adding device:", error);
      toast.error("Failed to add device");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clone device - pre-fill form with source device data and auto-calculate next IP
  const handleCloneDevice = (device: NetworkDevice) => {
    const vlanSchema = vlanSchemas.find((v) => v.vlan_id === device.vlan_id);
    const nextIp = vlanSchema ? calculateNextAvailableIp(vlanSchema, devices) : "";
    
    setFormData({
      device_name: device.device_name, // Keep name for easy editing
      ip_address: nextIp,
      gateway: vlanSchema?.gateway || "",
      type: device.type,
      mac_address: "", // Clear MAC as it must be unique
      location_id: device.location_id || "",
      vlan_id: device.vlan_id?.toString() || "",
      status: "Online",
      uplink_device_id: device.uplink_device_id || "",
    });
    setIsAddModalOpen(true);
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
    const devicesToInsert = data.map((row) => {
      const locationName = row.location || row["Location"] || "";
      const matchedLocation = locations.find(l => 
        l.name.toLowerCase() === locationName.toLowerCase() ||
        l.name.toLowerCase().includes(locationName.toLowerCase()) ||
        locationName.toLowerCase().includes(l.name.toLowerCase())
      );
      
      return {
        user_id: user?.id,
        device_name: row.device_name || row["Device Name"] || "",
        ip_address: row.ip_address || row["IP Address"] || "",
        type: row.type || row["Type"] || "Workstation",
        mac_address: row.mac_address || row["MAC Address"] || null,
        location: matchedLocation?.name || locationName,
        location_id: matchedLocation?.id || null,
        vlan_id: parseInt(row.vlan_id || row["VLAN"] || "1") || 1,
        status: row.status || row["Status"] || "Online",
      };
    });

    const validDevices = devicesToInsert.filter(d => d.device_name && d.ip_address);
    
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
    // Find gateway from VLAN schema if available
    const vlanSchema = vlanSchemas.find((v) => v.vlan_id === device.vlan_id);
    setEditFormData({
      device_name: device.device_name,
      ip_address: device.ip_address,
      gateway: vlanSchema?.gateway || "",
      type: device.type,
      mac_address: device.mac_address || "",
      location_id: device.location_id || "",
      vlan_id: device.vlan_id?.toString() || "",
      status: device.status,
      uplink_device_id: device.uplink_device_id || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingDevice || !editFormData.device_name || !editFormData.ip_address || !editFormData.location_id) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedLocation = locations.find(l => l.id === editFormData.location_id);
      const { error } = await supabase
        .from("network_devices")
        .update({
          device_name: editFormData.device_name,
          ip_address: editFormData.ip_address,
          type: editFormData.type,
          mac_address: editFormData.mac_address || null,
          location: selectedLocation?.name || "",
          location_id: editFormData.location_id,
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

  // Filter devices based on selected location, search, and type
  const filteredDevices = devices
    .filter(
      (device) =>
        device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.ip_address.includes(searchQuery) ||
        (device.mac_address && device.mac_address.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter((device) => selectedLocationId === "all" || device.location_id === selectedLocationId)
    .filter((device) => typeFilter === "all" || device.type === typeFilter);

  const onlineCount = filteredDevices.filter((d) => d.status === "Online").length;
  const offlineCount = filteredDevices.filter((d) => d.status === "Offline").length;

  // Get available uplink devices (exclude the current device if editing)
  const availableUplinkDevices = devices.filter(d => 
    ["Router", "Switch", "AP", "Server"].includes(d.type)
  );

  // Get device count by location for tabs
  const getLocationDeviceCount = (locationId: string) => {
    if (locationId === "all") return devices.length;
    return devices.filter(d => d.location_id === locationId).length;
  };

  // Get location name by id
  const getLocationName = (locationId: string | null) => {
    if (!locationId) return "-";
    const location = locations.find(l => l.id === locationId);
    return location?.name || "-";
  };

  // Export topology diagram as PDF
  const handleExportPdf = async () => {
    if (!topologyContainerRef.current || !topologyRef.current) {
      toast.error("Không tìm thấy sơ đồ mạng");
      return;
    }

    setIsExportingPdf(true);
    toast.info("Đang tạo PDF...");

    try {
      // Enable print mode for better rendering
      topologyRef.current.enablePrintMode();
      
      // Wait for React to re-render with print mode styles
      await new Promise(resolve => setTimeout(resolve, 300));

      // Capture using html-to-image (better SVG support)
      const dataUrl = await toPng(topologyContainerRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      // Create a temporary image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });

      // Create PDF in landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header with professional styling
      const currentDate = new Date().toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Add header background - professional blue
      pdf.setFillColor(30, 58, 95);
      pdf.rect(0, 0, pageWidth, 22, 'F');

      // Add accent line
      pdf.setFillColor(45, 212, 191);
      pdf.rect(0, 22, pageWidth, 1.5, 'F');

      // Add logo placeholder (a simple network icon representation)
      pdf.setFillColor(45, 212, 191);
      pdf.circle(12, 11, 4, 'F');
      pdf.setFontSize(7);
      pdf.setTextColor(30, 58, 95);
      pdf.text('FX', 10, 12.5);

      // Add title - using standard font for Unicode compatibility
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      // Use ASCII-safe title to avoid mojibake
      pdf.text('Network Topology Diagram', 20, 10);

      // Add Vietnamese subtitle as image-captured or simplified
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(200, 220, 230);
      pdf.text('So Do Ket Noi Mang - ' + currentDate, 20, 16);

      // Add company name on right
      pdf.setFontSize(11);
      pdf.setTextColor(45, 212, 191);
      pdf.text('FX Digital Center', pageWidth - 10, 12, { align: 'right' });

      // Calculate image dimensions to fit the page with margins
      const marginX = 10;
      const marginTop = 28;
      const marginBottom = 15;
      const availableWidth = pageWidth - (marginX * 2);
      const availableHeight = pageHeight - marginTop - marginBottom;
      
      const imgAspectRatio = img.width / img.height;
      let finalWidth = availableWidth;
      let finalHeight = finalWidth / imgAspectRatio;
      
      if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = finalHeight * imgAspectRatio;
      }

      // Center the image horizontally
      const xPos = (pageWidth - finalWidth) / 2;
      const yPos = marginTop;

      // Add border around the diagram
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(xPos - 1, yPos - 1, finalWidth + 2, finalHeight + 2);

      // Add the topology image
      pdf.addImage(dataUrl, 'PNG', xPos, yPos, finalWidth, finalHeight);

      // Add footer with device summary
      pdf.setFillColor(245, 247, 250);
      pdf.rect(0, pageHeight - 10, pageWidth, 10, 'F');
      
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      const onlineDevices = filteredDevices.filter(d => d.status === 'Online').length;
      const offlineDevices = filteredDevices.filter(d => d.status === 'Offline').length;
      pdf.text(
        `Exported: ${new Date().toLocaleString('vi-VN')} | Total Devices: ${filteredDevices.length} | Online: ${onlineDevices} | Offline: ${offlineDevices}`,
        pageWidth / 2,
        pageHeight - 4,
        { align: 'center' }
      );

      // Save the PDF
      pdf.save(`network-topology-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Đã xuất PDF thành công!");
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Lỗi khi xuất PDF");
    } finally {
      // Disable print mode to restore normal view
      topologyRef.current?.disablePrintMode();
      setIsExportingPdf(false);
    }
  };

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
              {/* VLAN Selection */}
              <div className="grid gap-2">
                <Label>{t("network_vlan")} *</Label>
                <Select value={formData.vlan_id} onValueChange={(value) => handleVlanChange(value, false)}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Chọn VLAN" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {vlanSchemas.map((vlan) => (
                      <SelectItem key={vlan.vlan_id} value={vlan.vlan_id.toString()}>
                        VLAN {vlan.vlan_id} - {vlan.name} ({vlan.subnet})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("network_ip_address")} *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="192.168.1.1"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      className="input-field flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => suggestNextIp(false)}
                      disabled={!formData.vlan_id}
                      title="Suggest IP"
                      className="shrink-0"
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Gateway</Label>
                  <Input
                    placeholder="192.168.1.1"
                    value={formData.gateway}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    className="input-field"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="IPTV">{t("device_iptv")}</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Chọn chi nhánh" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {loc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>{t("btn_cancel")}</Button>
              <Button 
                variant="secondary" 
                onClick={() => handleSubmit(true)} 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Lưu & Thêm Tiếp
              </Button>
              <Button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-primary text-primary-foreground">
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

      {/* Location Tabs */}
      <div className="glass-card p-2 overflow-x-auto">
        <Tabs value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <TabsList className="bg-transparent h-auto flex-wrap gap-1">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Tất cả ({getLocationDeviceCount("all")})
            </TabsTrigger>
            {locations.map((loc) => (
              <TabsTrigger 
                key={loc.id} 
                value={loc.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {loc.name} ({getLocationDeviceCount(loc.id)})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Network className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{filteredDevices.length}</p>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] input-field">
                <Filter className="w-4 h-4 mr-2" />
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
                <SelectItem value="IPTV">{t("device_iptv")}</SelectItem>
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
        <div className="space-y-4">
          {/* Topology Toolbar */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleExportPdf}
              disabled={isExportingPdf || filteredDevices.length === 0}
              className="gap-2"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Xuất Bản Vẽ (PDF)
                </>
              )}
            </Button>
          </div>
          <div ref={topologyContainerRef}>
            <NetworkTopology ref={topologyRef} devices={filteredDevices} />
          </div>
        </div>
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
                      <TableCell className="text-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {getLocationName(device.location_id) || device.location}
                        </div>
                      </TableCell>
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
                            onClick={() => handleCloneDevice(device)}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Nhân bản thiết bị"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
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
            {/* VLAN Selection */}
            <div className="grid gap-2">
              <Label>{t("network_vlan")} *</Label>
              <Select value={editFormData.vlan_id} onValueChange={(value) => handleVlanChange(value, true)}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Chọn VLAN" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {vlanSchemas.map((vlan) => (
                    <SelectItem key={vlan.vlan_id} value={vlan.vlan_id.toString()}>
                      VLAN {vlan.vlan_id} - {vlan.name} ({vlan.subnet})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("network_ip_address")} *</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="192.168.1.1"
                    value={editFormData.ip_address}
                    onChange={(e) => setEditFormData({ ...editFormData, ip_address: e.target.value })}
                    className="input-field flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => suggestNextIp(true)}
                    disabled={!editFormData.vlan_id}
                    title="Suggest IP"
                    className="shrink-0"
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Gateway</Label>
                <Input
                  placeholder="192.168.1.1"
                  value={editFormData.gateway}
                  onChange={(e) => setEditFormData({ ...editFormData, gateway: e.target.value })}
                  className="input-field"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="IPTV">{t("device_iptv")}</SelectItem>
                  </SelectContent>
                </Select>
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
              <Select value={editFormData.location_id} onValueChange={(value) => setEditFormData({ ...editFormData, location_id: value })}>
                <SelectTrigger className="input-field">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {loc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

