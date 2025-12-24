import { useState } from "react";
import {
  Plus,
  ClipboardList,
  Calendar,
  User,
  Flag,
  MoreVertical,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: number;
  title: string;
  priority: "High" | "Medium" | "Low";
  requester: string;
  dueDate: string;
  status: "todo" | "in_progress" | "pending_vendor" | "done";
}

const mockTasks: Task[] = [
  { id: 1, title: "Fix email server timeout", priority: "High", requester: "John Smith", dueDate: "2024-12-26", status: "todo" },
  { id: 2, title: "Setup new workstation - HR", priority: "Medium", requester: "Sarah Johnson", dueDate: "2024-12-28", status: "todo" },
  { id: 3, title: "Update firewall rules", priority: "High", requester: "IT Security", dueDate: "2024-12-25", status: "in_progress" },
  { id: 4, title: "Install Windows updates", priority: "Low", requester: "All Departments", dueDate: "2024-12-30", status: "in_progress" },
  { id: 5, title: "Waiting for new router delivery", priority: "Medium", requester: "Branch B", dueDate: "2025-01-05", status: "pending_vendor" },
  { id: 6, title: "SSL Certificate installation", priority: "High", requester: "Web Team", dueDate: "2025-01-02", status: "pending_vendor" },
  { id: 7, title: "Setup VPN for remote staff", priority: "Medium", requester: "HR", dueDate: "2024-12-24", status: "done" },
  { id: 8, title: "Migrate database to new server", priority: "High", requester: "Dev Team", dueDate: "2024-12-23", status: "done" },
  { id: 9, title: "Network cable replacement - Floor 2", priority: "Low", requester: "Facilities", dueDate: "2024-12-29", status: "todo" },
  { id: 10, title: "Printer driver update", priority: "Low", requester: "Finance", dueDate: "2024-12-27", status: "done" },
];

const columns = [
  { id: "todo", title: "To Do", color: "border-muted-foreground" },
  { id: "in_progress", title: "In Progress", color: "border-primary" },
  { id: "pending_vendor", title: "Pending Vendor", color: "border-warning" },
  { id: "done", title: "Done", color: "border-success" },
];

const priorityColors = {
  High: "bg-destructive/20 text-destructive border-destructive/30",
  Medium: "bg-warning/20 text-warning border-warning/30",
  Low: "bg-muted text-muted-foreground border-muted-foreground/30",
};

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="glass-card p-4 cursor-grab hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className={`status-badge text-xs ${priorityColors[task.priority]}`}>
          <Flag className="w-3 h-3 mr-1 inline" />
          {task.priority}
        </span>
      </div>
      
      <h3 className="font-medium text-foreground mb-3 line-clamp-2">{task.title}</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="w-3 h-3" />
          <span>{task.requester}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{task.dueDate}</span>
        </div>
      </div>

      <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover border-border">
            <DropdownMenuItem>Edit Task</DropdownMenuItem>
            <DropdownMenuItem>Change Priority</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function TaskTracker() {
  const [tasks] = useState<Task[]>(mockTasks);

  const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-primary" />
            Task Tracker
          </h1>
          <p className="text-muted-foreground mt-1">IT Helpdesk Kanban Board</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
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
                  col.id === 'done' ? 'text-success' :
                  col.id === 'pending_vendor' ? 'text-warning' :
                  col.id === 'in_progress' ? 'text-primary' :
                  'text-foreground'
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
                <TaskCard key={task.id} task={task} />
              ))}
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
