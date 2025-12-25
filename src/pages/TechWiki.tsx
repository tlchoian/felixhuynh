import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen,
  Search,
  FileText,
  ChevronRight,
  Plus,
  Clock,
  Edit,
  Loader2,
  Trash2,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { TiptapEditor } from "@/components/wiki/TiptapEditor";
import { useWikiDraft, useNewArticleDraft } from "@/hooks/useWikiDraft";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WikiArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function TechWiki() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<WikiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  // Draft hooks
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useWikiDraft(selectedArticle?.id || null);
  const { 
    saveDraft: saveNewDraft, 
    loadDraft: loadNewDraft, 
    clearDraft: clearNewDraft, 
    hasDraft: hasNewDraft 
  } = useNewArticleDraft();

  // Auto-save timer ref
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const defaultArticleContent = language === "vi" 
    ? `<h1>Bắt Đầu</h1><h2>Tổng Quan</h2><p>Viết tài liệu của bạn ở đây. Sử dụng "/" để chèn các khối nội dung.</p><h2>Ví Dụ Code</h2><pre><code># Lệnh ví dụ
echo "Xin chào"</code></pre><h2>Các Bước</h2><ol><li>Bước đầu tiên</li><li>Bước thứ hai</li><li>Bước thứ ba</li></ol>`
    : `<h1>Getting Started</h1><h2>Overview</h2><p>Write your documentation here. Use "/" to insert content blocks.</p><h2>Code Examples</h2><pre><code># Example command
echo "Hello World"</code></pre><h2>Steps</h2><ol><li>First step</li><li>Second step</li><li>Third step</li></ol>`;

  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    content: defaultArticleContent,
  });

  // Load new article draft on mount
  useEffect(() => {
    const draft = loadNewDraft();
    if (draft) {
      setFormData(draft);
    }
  }, []);

  // Auto-save new article draft
  useEffect(() => {
    if (isAddModalOpen && formData.title) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        saveNewDraft(formData);
      }, 1000);
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [formData, isAddModalOpen, saveNewDraft]);

  // Auto-save edit draft
  useEffect(() => {
    if (isEditing && selectedArticle && editContent) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => {
        saveDraft(editContent);
      }, 1000);
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [editContent, isEditing, selectedArticle, saveDraft]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("wiki_docs")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
      if (data && data.length > 0 && !selectedArticle) {
        setSelectedArticle(data[0]);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error(t("validation_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from("wiki_docs").insert({
        user_id: user?.id,
        title: formData.title,
        category: formData.category,
        content: formData.content,
      }).select().single();

      if (error) throw error;

      toast.success(t("wiki_created"));
      setIsAddModalOpen(false);
      clearNewDraft();
      setFormData({ title: "", category: "General", content: defaultArticleContent });
      fetchArticles();
      if (data) {
        setSelectedArticle(data);
      }
    } catch (error) {
      console.error("Error creating article:", error);
      toast.error("Failed to create article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedArticle) return;

    try {
      const { error } = await supabase
        .from("wiki_docs")
        .update({ content: editContent })
        .eq("id", selectedArticle.id);

      if (error) throw error;

      toast.success(t("wiki_article_updated"));
      setIsEditing(false);
      clearDraft();
      setSelectedArticle({ ...selectedArticle, content: editContent });
      fetchArticles();
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Failed to update article");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
    clearDraft();
  };

  const handleStartEdit = useCallback(() => {
    if (!selectedArticle) return;
    
    const draft = loadDraft();
    if (draft && draft !== selectedArticle.content) {
      // There's a draft that differs from saved content
      setEditContent(draft);
    } else {
      setEditContent(selectedArticle.content);
    }
    setIsEditing(true);
  }, [selectedArticle, loadDraft]);

  const handleRestoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) {
      setEditContent(draft);
      setIsEditing(true);
    }
  }, [loadDraft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("wiki_docs").delete().eq("id", id);
      if (error) throw error;
      toast.success(t("wiki_article_deleted"));
      if (selectedArticle?.id === id) {
        setSelectedArticle(null);
      }
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Failed to delete article");
    }
  };

  const categories = [...new Set(articles.map((a) => a.category))];

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            <BookOpen className="w-8 h-8 text-primary" />
            {t("wiki_title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("wiki_subtitle")}</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              {t("btn_new_article")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("wiki_add_title")}</DialogTitle>
              <DialogDescription>{t("wiki_add_description")}</DialogDescription>
            </DialogHeader>
            {hasNewDraft && (
              <Alert className="border-primary/50 bg-primary/10">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Draft restored from your previous session.
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("wiki_article_title")} *</Label>
                  <Input
                    placeholder="e.g., Ubuntu Server Setup"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("wiki_category")}</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="General">{t("wiki_cat_general")}</SelectItem>
                      <SelectItem value="Linux">{t("wiki_cat_linux")}</SelectItem>
                      <SelectItem value="Networking">{t("wiki_cat_networking")}</SelectItem>
                      <SelectItem value="Security">{t("wiki_cat_security")}</SelectItem>
                      <SelectItem value="Monitoring">{t("wiki_cat_monitoring")}</SelectItem>
                      <SelectItem value="Best Practices">{t("wiki_cat_best_practices")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t("wiki_content")} *</Label>
                <div className="border border-border rounded-lg p-3 bg-background">
                  <TiptapEditor
                    content={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Type / for commands or start writing..."
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

      {/* Main Layout */}
      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("wiki_search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 input-field"
            />
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t("wiki_categories")}</h3>
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
                  {t("wiki_all")}
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
          )}

          {/* Articles List */}
          <ScrollArea className="glass-card h-[calc(100%-160px)]">
            <div className="p-2 space-y-1">
              {filteredArticles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {t("wiki_no_articles")}
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => {
                      setSelectedArticle(article);
                      setIsEditing(false);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                      selectedArticle?.id === article.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <FileText className={cn(
                      "w-4 h-4 flex-shrink-0",
                      selectedArticle?.id === article.id ? "text-primary" : "text-muted-foreground"
                    )} />
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        selectedArticle?.id === article.id ? "text-primary" : "text-foreground"
                      )}>
                        {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{article.category}</p>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 ml-auto flex-shrink-0",
                      selectedArticle?.id === article.id ? "text-primary" : "text-muted-foreground"
                    )} />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content Area */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          {selectedArticle ? (
            <>
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
                        <Clock className="w-3 h-3" />
                        {t("wiki_updated")}: {new Date(selectedArticle.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 mr-2" />
                          {t("btn_cancel")}
                        </Button>
                        <Button onClick={handleSaveEdit} size="sm" className="bg-primary text-primary-foreground">
                          <Save className="w-4 h-4 mr-2" />
                          {t("btn_save")}
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartEdit}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {t("btn_edit")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(selectedArticle.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Draft restore banner */}
                {!isEditing && hasDraft && (
                  <Alert className="mt-4 border-primary/50 bg-primary/10">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-sm">You have unsaved changes from a previous session.</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleDiscardDraft}>
                          Discard
                        </Button>
                        <Button size="sm" onClick={handleRestoreDraft}>
                          Restore Draft
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Article Content */}
              <ScrollArea className="flex-1 p-6">
                {isEditing ? (
                  <div className="border border-border rounded-lg p-3 bg-background">
                    <TiptapEditor
                      content={editContent}
                      onChange={setEditContent}
                      placeholder="Type / for commands or start writing..."
                    />
                  </div>
                ) : (
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">{t("wiki_no_selected")}</h3>
                <p className="text-sm text-muted-foreground">{t("wiki_no_selected_desc")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
