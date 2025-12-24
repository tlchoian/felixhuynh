import { useState, useRef } from "react";
import { Upload, Download, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Papa from "papaparse";
import { useLanguage } from "@/contexts/LanguageContext";

interface CsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateColumns: string[];
  templateFileName: string;
  onImport: (data: Record<string, string>[]) => Promise<void>;
  title: string;
  description: string;
}

export function CsvImportModal({
  open,
  onOpenChange,
  templateColumns,
  templateFileName,
  onImport,
  title,
  description,
}: CsvImportModalProps) {
  const { t } = useLanguage();
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = templateColumns.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${templateFileName}_template.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(t("csv_template_downloaded"));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error(t("csv_invalid_file"));
      return;
    }

    setSelectedFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        setPreviewData(data.slice(0, 5)); // Preview first 5 rows
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        toast.error(t("csv_parse_error"));
      },
    });
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const data = results.data as Record<string, string>[];
          if (data.length === 0) {
            toast.error(t("csv_no_data"));
            setIsImporting(false);
            return;
          }

          try {
            await onImport(data);
            toast.success(t("csv_import_success").replace("{count}", data.length.toString()));
            handleClose();
          } catch (error) {
            console.error("Import error:", error);
            toast.error(t("csv_import_error"));
          } finally {
            setIsImporting(false);
          }
        },
        error: (error) => {
          console.error("CSV parse error:", error);
          toast.error(t("csv_parse_error"));
          setIsImporting(false);
        },
      });
    } catch (error) {
      console.error("Import error:", error);
      toast.error(t("csv_import_error"));
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("csv_download_template")}</p>
                <p className="text-xs text-muted-foreground">{t("csv_template_description")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              {t("csv_download")}
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("csv_select_file")}</label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer border border-border rounded-lg"
              />
            </div>
          </div>

          {/* Preview */}
          {selectedFile && previewData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {t("csv_preview")} ({previewData.length} {t("csv_rows")})
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewData([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-t border-border">
                        {Object.values(row).map((val, vIdx) => (
                          <td key={vIdx} className="px-3 py-2 text-foreground truncate max-w-[150px]">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("btn_cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="bg-primary text-primary-foreground"
          >
            {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("csv_import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
