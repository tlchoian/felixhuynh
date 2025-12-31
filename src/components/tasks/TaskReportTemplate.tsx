import { forwardRef } from "react";
import { format, parseISO } from "date-fns";
import { Shield } from "lucide-react";

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

interface TaskReportTemplateProps {
  tasks: Task[];
  reportPeriod: string;
  entities: string[];
  reporterName?: string;
}

const TaskReportTemplate = forwardRef<HTMLDivElement, TaskReportTemplateProps>(
  ({ tasks, reportPeriod, entities, reporterName }, ref) => {
    const today = new Date();
    
    // Group tasks by entity
    const tasksByEntity: Record<string, Task[]> = {};
    entities.forEach((entity) => {
      tasksByEntity[entity] = tasks.filter((t) => t.entity === entity);
    });

    // Summary stats
    const totalTasks = tasks.length;
    const resolvedTasks = tasks.filter((t) => t.status === "resolved").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

    const getStatusText = (status: string) => {
      switch (status) {
        case "resolved": return "Hoàn thành";
        case "in_progress": return "Đang xử lý";
        default: return "Chờ xử lý";
      }
    };

    const getStatusStyle = (status: string) => {
      switch (status) {
        case "resolved": return { backgroundColor: "#bbf7d0", color: "#15803d", fontWeight: 600 };
        case "in_progress": return { backgroundColor: "#bfdbfe", color: "#1d4ed8", fontWeight: 600 };
        default: return { backgroundColor: "#fed7aa", color: "#c2410c", fontWeight: 600 };
      }
    };

    return (
      <div
        ref={ref}
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm",
          backgroundColor: "#ffffff",
          fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
          color: "#1f2937",
          fontSize: "11pt",
          lineHeight: 1.5,
        }}
      >
        {/* Professional Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "flex-start",
          marginBottom: "20px",
        }}>
          {/* Left: Logo placeholder */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#3b82f6",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Shield style={{ width: "28px", height: "28px", color: "#ffffff" }} />
            </div>
            <div>
              <div style={{ 
                fontSize: "18pt", 
                fontWeight: 700, 
                color: "#1e3a5f",
                letterSpacing: "-0.5px",
              }}>
                FX DIGITAL CENTER
              </div>
              <div style={{ fontSize: "9pt", color: "#6b7280" }}>
                IT Infrastructure & Support
              </div>
            </div>
          </div>
          
          {/* Right: Date info */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9pt", color: "#6b7280" }}>
              Ngày xuất báo cáo
            </div>
            <div style={{ fontSize: "11pt", fontWeight: 600, color: "#374151" }}>
              {format(today, "dd/MM/yyyy")}
            </div>
          </div>
        </div>

        {/* Separator line */}
        <div style={{ 
          borderBottom: "2px solid #e5e7eb", 
          marginBottom: "20px",
        }} />

        {/* Report Title */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ 
            fontSize: "16pt", 
            fontWeight: 700, 
            color: "#1f2937",
            marginBottom: "6px",
          }}>
            BÁO CÁO CÔNG VIỆC KỸ THUẬT
          </h1>
          <div style={{ fontSize: "12pt", color: "#6b7280" }}>
            {reportPeriod}
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginBottom: "24px",
          padding: "12px 20px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20pt", fontWeight: 700, color: "#3b82f6" }}>{totalTasks}</div>
            <div style={{ fontSize: "9pt", color: "#64748b" }}>Tổng số</div>
          </div>
          <div style={{ width: "1px", backgroundColor: "#e2e8f0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20pt", fontWeight: 700, color: "#22c55e" }}>{resolvedTasks}</div>
            <div style={{ fontSize: "9pt", color: "#64748b" }}>Hoàn thành</div>
          </div>
          <div style={{ width: "1px", backgroundColor: "#e2e8f0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20pt", fontWeight: 700, color: "#3b82f6" }}>{inProgressTasks}</div>
            <div style={{ fontSize: "9pt", color: "#64748b" }}>Đang xử lý</div>
          </div>
          <div style={{ width: "1px", backgroundColor: "#e2e8f0" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20pt", fontWeight: 700, color: "#f59e0b" }}>{pendingTasks}</div>
            <div style={{ fontSize: "9pt", color: "#64748b" }}>Chờ xử lý</div>
          </div>
        </div>

        {/* Tasks by Entity */}
        {entities.map((entity) => {
          const entityTasks = tasksByEntity[entity];
          if (entityTasks.length === 0) return null;

          return (
            <div key={entity} style={{ marginBottom: "24px" }}>
              {/* Entity Header */}
              <div style={{
                backgroundColor: "#1e3a5f",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "6px 6px 0 0",
                fontWeight: 600,
                fontSize: "11pt",
              }}>
                {entity} ({entityTasks.length} công việc)
              </div>

              {/* Table */}
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10pt",
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9" }}>
                    <th style={{ 
                      padding: "10px 8px", 
                      textAlign: "left", 
                      fontWeight: 600,
                      borderBottom: "2px solid #e2e8f0",
                      width: "8%",
                      whiteSpace: "nowrap",
                    }}>
                      Ngày
                    </th>
                    <th style={{ 
                      padding: "10px 8px", 
                      textAlign: "left", 
                      fontWeight: 600,
                      borderBottom: "2px solid #e2e8f0",
                      width: "50%",
                    }}>
                      Vấn đề
                    </th>
                    <th style={{ 
                      padding: "10px 8px", 
                      textAlign: "center", 
                      fontWeight: 600,
                      borderBottom: "2px solid #e2e8f0",
                      width: "10%",
                      whiteSpace: "nowrap",
                    }}>
                      Trạng thái
                    </th>
                    <th style={{ 
                      padding: "10px 8px", 
                      textAlign: "left", 
                      fontWeight: 600,
                      borderBottom: "2px solid #e2e8f0",
                      width: "32%",
                    }}>
                      Ghi chú xử lý
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entityTasks.map((task, index) => (
                    <tr 
                      key={task.id} 
                      style={{ 
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      <td style={{ 
                        padding: "10px 8px", 
                        borderBottom: "1px solid #e2e8f0",
                        verticalAlign: "top",
                      }}>
                        {format(parseISO(task.created_at), "dd/MM")}
                      </td>
                      <td style={{ 
                        padding: "10px 8px", 
                        borderBottom: "1px solid #e2e8f0",
                        verticalAlign: "top",
                        wordBreak: "break-word",
                      }}>
                        {task.title}
                      </td>
                      <td style={{ 
                        padding: "10px 8px", 
                        borderBottom: "1px solid #e2e8f0",
                        textAlign: "center",
                        verticalAlign: "top",
                      }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "9pt",
                          fontWeight: 500,
                          ...getStatusStyle(task.status),
                        }}>
                          {getStatusText(task.status)}
                        </span>
                      </td>
                      <td style={{ 
                        padding: "10px 8px", 
                        borderBottom: "1px solid #e2e8f0",
                        verticalAlign: "top",
                        wordBreak: "break-word",
                        color: task.resolution_notes ? "#374151" : "#9ca3af",
                      }}>
                        {task.resolution_notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Footer with signature */}
        <div style={{ 
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}>
          {/* Left: Page number */}
          <div style={{ fontSize: "9pt", color: "#9ca3af" }}>
            Trang 1
          </div>

          {/* Right: Signature */}
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              fontSize: "10pt", 
              color: "#6b7280",
              marginBottom: "6px",
            }}>
              Người báo cáo
            </div>
            <div style={{ 
              fontSize: "11pt", 
              fontWeight: 600, 
              color: "#374151",
              marginBottom: "40px",
            }}>
              {reporterName || "IT Manager"}
            </div>
            <div style={{ 
              width: "150px", 
              borderTop: "1px solid #374151",
              paddingTop: "8px",
              fontSize: "9pt",
              color: "#6b7280",
            }}>
              (Ký tên)
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TaskReportTemplate.displayName = "TaskReportTemplate";

export default TaskReportTemplate;
