import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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

  const defaultArticleContent = language === "vi" 
    ? `# Bắt Đầu

## Tổng Quan
Viết tài liệu của bạn ở đây sử dụng cú pháp Markdown.

## Ví Dụ Code
\`\`\`bash
# Lệnh ví dụ
echo "Xin chào"
\`\`\`

## Các Bước
1. Bước đầu tiên
2. Bước thứ hai
3. Bước thứ ba
`
    : `# Getting Started

## Overview
Write your documentation here using Markdown syntax.

## Code Examples
\`\`\`bash
# Example command
echo "Hello World"
\`\`\`

## Steps
1. First step
2. Second step
3. Third step
`;

  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    content: defaultArticleContent,
  });

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
      setSelectedArticle({ ...selectedArticle, content: editContent });
      fetchArticles();
    } catch (error) {
      console.error("Error updating article:", error);
      toast.error("Failed to update article");
    }
  };

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

  const renderMarkdown = (content: string) => {
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-2xl font-bold text-foreground mt-6 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-xl font-semibold text-foreground mt-5 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-lg font-medium text-foreground mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith("```")) {
          return null;
        }
        if (line.startsWith("- ")) {
          return <li key={i} className="text-muted-foreground ml-4">{line.slice(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="text-muted-foreground ml-4 list-decimal">{line.replace(/^\d+\. /, "")}</li>;
        }
        if (line.trim() === "") {
          return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground my-1">{line}</p>;
      });
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
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("wiki_add_title")}</DialogTitle>
              <DialogDescription>{t("wiki_add_description")}</DialogDescription>
            </DialogHeader>
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
                <Textarea
                  placeholder="Write your documentation here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[300px] font-mono text-sm"
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
                      <Button onClick={handleSaveEdit} size="sm" className="bg-primary text-primary-foreground">
                        <Save className="w-4 h-4 mr-2" />
                        {t("btn_save")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(true);
                          setEditContent(selectedArticle.content);
                        }}
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
              </div>

              {/* Article Content */}
              <ScrollArea className="flex-1 p-6">
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="input-field min-h-[500px] font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    {renderMarkdown(selectedArticle.content)}
                  </div>
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
