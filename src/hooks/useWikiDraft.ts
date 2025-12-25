import { useState, useEffect, useCallback } from 'react';

const DRAFT_KEY_PREFIX = 'wiki_draft_';
const NEW_ARTICLE_DRAFT_KEY = 'wiki_new_article_draft';

interface NewArticleDraft {
  title: string;
  category: string;
  content: string;
}

export function useWikiDraft(articleId: string | null) {
  const [hasDraft, setHasDraft] = useState(false);

  const getDraftKey = useCallback(() => {
    return articleId ? `${DRAFT_KEY_PREFIX}${articleId}` : null;
  }, [articleId]);

  // Check if draft exists on mount
  useEffect(() => {
    const key = getDraftKey();
    if (key) {
      const draft = localStorage.getItem(key);
      setHasDraft(!!draft);
    }
  }, [getDraftKey]);

  const saveDraft = useCallback((content: string) => {
    const key = getDraftKey();
    if (key && content) {
      localStorage.setItem(key, content);
      setHasDraft(true);
    }
  }, [getDraftKey]);

  const loadDraft = useCallback((): string | null => {
    const key = getDraftKey();
    if (key) {
      return localStorage.getItem(key);
    }
    return null;
  }, [getDraftKey]);

  const clearDraft = useCallback(() => {
    const key = getDraftKey();
    if (key) {
      localStorage.removeItem(key);
      setHasDraft(false);
    }
  }, [getDraftKey]);

  return { saveDraft, loadDraft, clearDraft, hasDraft };
}

export function useNewArticleDraft() {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem(NEW_ARTICLE_DRAFT_KEY);
    setHasDraft(!!draft);
  }, []);

  const saveDraft = useCallback((data: NewArticleDraft) => {
    localStorage.setItem(NEW_ARTICLE_DRAFT_KEY, JSON.stringify(data));
    setHasDraft(true);
  }, []);

  const loadDraft = useCallback((): NewArticleDraft | null => {
    const draft = localStorage.getItem(NEW_ARTICLE_DRAFT_KEY);
    if (draft) {
      try {
        return JSON.parse(draft);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(NEW_ARTICLE_DRAFT_KEY);
    setHasDraft(false);
  }, []);

  return { saveDraft, loadDraft, clearDraft, hasDraft };
}
