import { useState, useEffect, useRef } from "react";
import {
  Plus,
  ClipboardList,
  Calendar,
  User,
  Flag,
  MoreVertical,
  Loader2,
  Pencil,
  FileText,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import TaskReportTemplate from "@/components/tasks/TaskReportTemplate";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  requester: string;
  due_date: string | null;
  status: string;
  entity: string | null;
  resolution_notes: string | null;
  created_at: string;
}

const ENTITIES = [
  "Fxdigital",
  "MV 88 VNG",
  "MV Trần Phú",
  "MV 17 LTK",
  "MV Silk",
  "Cá nhân",
];

const priorityColors: Record<string, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="w-3 h-3" />,
  in_progress: <Clock className="w-3 h-3" />,
  resolved: <CheckCircle2 className="w-3 h-3" />,
};

function TaskCard({ task, onStatusChange, onDelete, onEdit, t }: { 
  task: Task; 
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  t: (key: any) => string;
}) {
  return (
    <div className="glass-card p-4 hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`status-badge text-xs ${priorityColors[task.priority]}`}>
            <Flag className="w-3 h-3 mr-1 inline" />
            {task.priority === "High" ? t("priority_high") : 
             task.priority === "Medium" ? t("priority_medium") : t("priority_low")}
          </span>
          <span className={`status-badge text-xs flex items-center gap-1 ${statusColors[task.status] || statusColors.pending}`}>
            {statusIcons[task.status]}
            {task.status === "pending" ? t("task_status_pending") :
             task.status === "in_progress" ? t("task_status_in_progress") :
             task.status === "resolved" ? t("task_status_resolved") : task.status}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="w-4 h-4 mr-2" />
              {t("btn_edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "pending")}>{t("tasks_move_to")} {t("task_status_pending")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "in_progress")}>{t("tasks_move_to")} {t("task_status_in_progress")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "resolved")}>{t("tasks_move_to")} {t("task_status_resolved")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>{t("btn_delete")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="font-medium text-foreground mb-3 line-clamp-2">{task.title}</h3>
      
      {task.entity && (
        <div className="flex items-center gap-2 text-xs text-primary mb-2">
          <Building2 className="w-3 h-3" />
          <span>{task.entity}</span>
        </div>
      )}
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="w-3 h-3" />
          <span>{task.requester}</span>
        </div>
        {task.due_date && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{task.due_date}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskTracker() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const columns = [
    { id: "pending", title: t("task_status_pending"), color: "border-amber-500", icon: AlertCircle },
    { id: "in_progress", title: t("task_status_in_progress"), color: "border-blue-500", icon: Clock },
    { id: "resolved", title: t("task_status_resolved"), color: "border-emerald-500", icon: CheckCircle2 },
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    requester: "",
    due_date: "",
    status: "pending",
    entity: "Cá nhân",
    resolution_notes: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    requester: "",
    due_date: "",
    status: "pending",
    entity: "Cá nhân",
    resolution_notes: "",
  });

  const [exportDateRange, setExportDateRange] = useState<"week" | "month" | "custom">("week");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.requester) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        user_id: user?.id,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        requester: formData.requester,
        due_date: formData.due_date || null,
        status: formData.status,
        entity: formData.entity,
        resolution_notes: formData.resolution_notes || null,
      });

      if (error) throw error;

      toast.success(t("tasks_created"));
      setIsAddModalOpen(false);
      setFormData({ title: "", description: "", priority: "Medium", requester: "", due_date: "", status: "pending", entity: "Cá nhân", resolution_notes: "" });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(t("tasks_updated"));
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("tasks_deleted"));
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      requester: task.requester,
      due_date: task.due_date || "",
      status: task.status,
      entity: task.entity || "Cá nhân",
      resolution_notes: task.resolution_notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingTask || !editFormData.title || !editFormData.requester) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editFormData.title,
          description: editFormData.description || null,
          priority: editFormData.priority,
          requester: editFormData.requester,
          due_date: editFormData.due_date || null,
          status: editFormData.status,
          entity: editFormData.entity,
          resolution_notes: editFormData.resolution_notes || null,
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      toast.success(t("tasks_updated"));
      setIsEditModalOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => {
      const statusMatch = t.status === status;
      const entityMatch = filterEntity === "all" || t.entity === filterEntity;
      return statusMatch && entityMatch;
    });
  };

  const getFilteredTasks = () => {
    return tasks.filter((t) => {
      const entityMatch = filterEntity === "all" || t.entity === filterEntity;
      const statusMatch = filterStatus === "all" || t.status === filterStatus;
      return entityMatch && statusMatch;
    });
  };

  const [reportData, setReportData] = useState<{ tasks: Task[]; reportPeriod: string } | null>(null);

  const generatePDFReport = async () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let reportPeriod: string;

    if (exportDateRange === "week") {
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      endDate = endOfWeek(today, { weekStartsOn: 1 });
      reportPeriod = `Tuần ${format(startDate, "dd/MM")} - ${format(endDate, "dd/MM/yyyy")}`;
    } else if (exportDateRange === "month") {
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      reportPeriod = `Tháng ${format(today, "MM/yyyy")}`;
    } else {
      startDate = customStartDate ? parseISO(customStartDate) : startOfWeek(today, { weekStartsOn: 1 });
      endDate = customEndDate ? parseISO(customEndDate) : endOfWeek(today, { weekStartsOn: 1 });
      reportPeriod = `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
    }

    // Filter tasks within date range
    const filteredTasks = tasks.filter((task) => {
      const taskDate = parseISO(task.created_at);
      return taskDate >= startDate && taskDate <= endDate;
    });

    if (filteredTasks.length === 0) {
      toast.error("Không có công việc nào trong khoảng thời gian này");
      return;
    }

    // Set report data to render the template
    setReportData({ tasks: filteredTasks, reportPeriod });
    setIsGeneratingPdf(true);

    // Wait for the template to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (!reportRef.current) {
        throw new Error("Report template not ready");
      }

      // Convert HTML to image
      const dataUrl = await toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      // Create PDF from image
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Add the image to the PDF
      doc.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight);

      // Save PDF
      doc.save(`Bao-cao-ky-thuat-${format(today, "yyyy-MM-dd")}.pdf`);
      toast.success("Đã xuất báo cáo PDF thành công!");
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Lỗi khi xuất PDF");
    } finally {
      setIsGeneratingPdf(false);
      setReportData(null);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            {t("tasks_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("tasks_subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsExportModalOpen(true)}
            className="border-border"
          >
            <FileText className="w-4 h-4 mr-2" />
            Xuất PDF
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                {t("btn_new_task")}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("tasks_add_title")}</DialogTitle>
                <DialogDescription>{t("tasks_add_description")}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>{t("tasks_task_title")} *</Label>
                  <Input
                    placeholder="e.g., Fix Router Trần Phú"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Đơn vị *</Label>
                    <Select value={formData.entity} onValueChange={(value) => setFormData({ ...formData, entity: value })}>
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {ENTITIES.map((entity) => (
                          <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("tasks_requester")} *</Label>
                    <Input
                      placeholder="Nguyễn Văn A"
                      value={formData.requester}
                      onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>{t("tasks_priority")}</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="High">{t("priority_high")}</SelectItem>
                        <SelectItem value="Medium">{t("priority_medium")}</SelectItem>
                        <SelectItem value="Low">{t("priority_low")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("tasks_status")}</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="input-field">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="pending">{t("task_status_pending")}</SelectItem>
                        <SelectItem value="in_progress">{t("task_status_in_progress")}</SelectItem>
                        <SelectItem value="resolved">{t("task_status_resolved")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>{t("tasks_due_date")}</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("tasks_description")}</Label>
                  <Textarea
                    placeholder="Mô tả chi tiết vấn đề..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field min-h-[60px]"
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Lọc:</span>
        </div>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[180px] input-field">
            <SelectValue placeholder="Đơn vị" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">Tất cả đơn vị</SelectItem>
            {ENTITIES.map((entity) => (
              <SelectItem key={entity} value={entity}>{entity}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const count = getTasksByStatus(col.id).length;
          const Icon = col.icon;
          return (
            <div key={col.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${
                    col.id === "resolved" ? "text-emerald-400" :
                    col.id === "in_progress" ? "text-blue-400" :
                    "text-amber-400"
                  }`} />
                  <p className="text-sm text-muted-foreground">{col.title}</p>
                </div>
                <span className={`text-2xl font-bold ${
                  col.id === "resolved" ? "text-emerald-400" :
                  col.id === "in_progress" ? "text-blue-400" :
                  "text-amber-400"
                }`}>{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className={`flex items-center gap-2 pb-2 border-b-2 ${column.color}`}>
              <column.icon className={`w-4 h-4 ${
                column.id === "resolved" ? "text-emerald-400" :
                column.id === "in_progress" ? "text-blue-400" :
                "text-amber-400"
              }`} />
              <h2 className="font-semibold text-foreground">{column.title}</h2>
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">
                {getTasksByStatus(column.id).length}
              </span>
            </div>
            <div className="kanban-column space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  t={t}
                />
              ))}
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("tasks_no_tasks")}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Task Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("tasks_edit_title")}</DialogTitle>
            <DialogDescription>{t("tasks_edit_description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t("tasks_task_title")} *</Label>
              <Input
                placeholder="e.g., Fix Router Trần Phú"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Đơn vị *</Label>
                <Select value={editFormData.entity} onValueChange={(value) => setEditFormData({ ...editFormData, entity: value })}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {ENTITIES.map((entity) => (
                      <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("tasks_requester")} *</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={editFormData.requester}
                  onChange={(e) => setEditFormData({ ...editFormData, requester: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("tasks_priority")}</Label>
                <Select value={editFormData.priority} onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="High">{t("priority_high")}</SelectItem>
                    <SelectItem value="Medium">{t("priority_medium")}</SelectItem>
                    <SelectItem value="Low">{t("priority_low")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("tasks_status")}</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                  <SelectTrigger className="input-field">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="pending">{t("task_status_pending")}</SelectItem>
                    <SelectItem value="in_progress">{t("task_status_in_progress")}</SelectItem>
                    <SelectItem value="resolved">{t("task_status_resolved")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("tasks_due_date")}</Label>
              <Input
                type="date"
                value={editFormData.due_date}
                onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="grid gap-2">
              <Label>{t("tasks_description")}</Label>
              <Textarea
                placeholder="Mô tả chi tiết vấn đề..."
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="input-field min-h-[60px]"
              />
            </div>
            <div className="grid gap-2">
              <Label>Ghi chú xử lý</Label>
              <Textarea
                placeholder="Mô tả cách đã xử lý vấn đề..."
                value={editFormData.resolution_notes}
                onChange={(e) => setEditFormData({ ...editFormData, resolution_notes: e.target.value })}
                className="input-field min-h-[60px]"
              />
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

      {/* Export PDF Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Xuất Báo Cáo PDF</DialogTitle>
            <DialogDescription>Chọn khoảng thời gian để xuất báo cáo công việc kỹ thuật</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Khoảng thời gian</Label>
              <Select value={exportDateRange} onValueChange={(value: "week" | "month" | "custom") => setExportDateRange(value)}>
                <SelectTrigger className="input-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="week">Tuần này</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                  <SelectItem value="custom">Tùy chọn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {exportDateRange === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Từ ngày</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>Hủy</Button>
            <Button 
              onClick={generatePDFReport} 
              className="bg-primary text-primary-foreground"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {isGeneratingPdf ? "Đang xuất..." : "Xuất PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden report template for PDF generation */}
      {reportData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <TaskReportTemplate
            ref={reportRef}
            tasks={reportData.tasks}
            reportPeriod={reportData.reportPeriod}
            entities={ENTITIES}
          />
        </div>
      )}
    </div>
  );
}
