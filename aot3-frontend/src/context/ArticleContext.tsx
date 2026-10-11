"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "aot3.article";

export interface ArticleState {
  extractedText: string;
  sourceLabel: string;
  title: string;
  targetLanguage: string;
}

const defaultState: ArticleState = {
  extractedText: "",
  sourceLabel: "",
  title: "",
  targetLanguage: "English",
};

function readStoredArticle(): ArticleState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<ArticleState>;
    return {
      extractedText: parsed.extractedText ?? "",
      sourceLabel: parsed.sourceLabel ?? "",
      title: parsed.title ?? "",
      targetLanguage: parsed.targetLanguage ?? "English",
    };
  } catch {
    return defaultState;
  }
}

interface ArticleContextValue extends ArticleState {
  hydrated: boolean;
  setArticle: (next: Partial<ArticleState>) => void;
}

const ArticleContext = createContext<ArticleContextValue | null>(null);

export function ArticleProvider({ children }: { children: ReactNode }) {
  const [article, setArticleState] = useState<ArticleState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setArticleState(readStoredArticle());
    setHydrated(true);
  }, []);

  const setArticle = useCallback((next: Partial<ArticleState>) => {
    setArticleState((previous) => {
      const merged = { ...previous, ...next };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = useMemo(
    () => ({ ...article, hydrated, setArticle }),
    [article, hydrated, setArticle]
  );

  return (
    <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>
  );
}

export function useArticle() {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error("useArticle must be used within ArticleProvider");
  }
  return context;
}
