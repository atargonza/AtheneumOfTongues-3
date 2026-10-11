export interface TranslationResult {
  original: string;
  translation: string;
}

export interface ExtractedArticle {
  extractedText: string;
  sourceLabel: string;
  title: string;
}

export interface Flashcard {
  id: string;
  word: string;
  translation: string;
  deck_name: string;
  status: "needs_review" | "mastered";
}

export type FlashcardStatusFilter = "all" | "needs_review" | "mastered";

export const TARGET_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Japanese",
  "Korean",
  "Chinese",
] as const;
