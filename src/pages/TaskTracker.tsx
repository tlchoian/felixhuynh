import { useState, useEffect } from "react";
import {
  Plus,
  ClipboardList,
  Calendar,
  User,
  Flag,
  MoreVertical,
  Loader2,
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

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  requester: string;
  due_date: string | null;
  status: string;
}

const priorityColors: Record<string, string> = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-muted-foreground/30",
};

function TaskCard({ task, onStatusChange, onDelete, t }: { 
  task: Task; 
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  t: (key: any) => string;
}) {
  return (
    <div className="glass-card p-4 hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <span className={`status-badge text-xs ${priorityColors[task.priority]}`}>
          <Flag className="w-3 h-3 mr-1 inline" />
          {task.priority === "High" ? t("priority_high") : 
           task.priority === "Medium" ? t("priority_medium") : t("priority_low")}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>{t("tasks_move_to")} {t("task_todo")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "in_progress")}>{t("tasks_move_to")} {t("task_in_progress")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "pending_vendor")}>{t("tasks_move_to")} {t("task_pending_vendor")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "done")}>{t("tasks_move_to")} {t("task_done")}</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>{t("btn_delete")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <h3 className="font-medium text-foreground mb-3 line-clamp-2">{task.title}</h3>
      
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = [
    { id: "todo", title: t("task_todo"), color: "border-muted-foreground" },
    { id: "in_progress", title: t("task_in_progress"), color: "border-primary" },
    { id: "pending_vendor", title: t("task_pending_vendor"), color: "border-warning" },
    { id: "done", title: t("task_done"), color: "border-success" },
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    requester: "",
    due_date: "",
    status: "todo",
  });

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
      });

      if (error) throw error;

      toast.success(t("tasks_created"));
      setIsAddModalOpen(false);
      setFormData({ title: "", description: "", priority: "Medium", requester: "", due_date: "", status: "todo" });
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

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

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
            <ClipboardList className="w-8 h-8 text-primary" />
            {t("tasks_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("tasks_subtitle")}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_new_task")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{t("tasks_add_title")}</DialogTitle>
              <DialogDescription>{t("tasks_add_description")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("tasks_task_title")} *</Label>
                <Input
                  placeholder="e.g., Fix email server timeout"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("tasks_description")}</Label>
                <Textarea
                  placeholder="Additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[80px]"
                />
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
                      <SelectItem value="todo">{t("task_todo")}</SelectItem>
                      <SelectItem value="in_progress">{t("task_in_progress")}</SelectItem>
                      <SelectItem value="pending_vendor">{t("task_pending_vendor")}</SelectItem>
                      <SelectItem value="done">{t("task_done")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("tasks_requester")} *</Label>
                  <Input
                    placeholder="John Smith"
                    value={formData.requester}
                    onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                    className="input-field"
                  />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const count = getTasksByStatus(col.id).length;
          return (
            <div key={col.id} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{col.title}</p>
                <span className={`text-2xl font-bold ${
                  col.id === "done" ? "text-success" :
                  col.id === "pending_vendor" ? "text-warning" :
                  col.id === "in_progress" ? "text-primary" :
                  "text-foreground"
                }`}>{count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className={`flex items-center gap-2 pb-2 border-b-2 ${column.color}`}>
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
    </div>
  );
}
