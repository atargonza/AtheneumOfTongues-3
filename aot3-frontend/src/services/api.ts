import type { Flashcard, TranslationResult } from "@/src/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const translationCache = new Map<string, TranslationResult>();
const inFlight = new Map<string, Promise<TranslationResult>>();

function cacheKey(kind: string, text: string, language: string): string {
  return `${kind}:${language.trim().toLowerCase()}:${text.trim().toLowerCase()}`;
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (data.detail) return JSON.stringify(data.detail);
  } catch {
    /* ignore parse errors */
  }
  return response.statusText || "Request failed";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
  return (await response.json()) as T;
}

export function getCachedTranslation(
  text: string,
  targetLanguage: string,
  kind: "word" | "sentence" = "word"
): TranslationResult | undefined {
  return translationCache.get(cacheKey(kind, text, targetLanguage));
}

async function cachedGeminiCall(
  kind: "word" | "sentence",
  text: string,
  targetLanguage: string,
  request: () => Promise<TranslationResult>
): Promise<TranslationResult> {
  const key = cacheKey(kind, text, targetLanguage);
  const cached = translationCache.get(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = request()
    .then((result) => {
      translationCache.set(key, result);
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export async function uploadFile(file: File): Promise<{
  filename: string;
  file_type: string;
  character_count: number;
  extracted_text: string;
}> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch("/media/upload-file", { method: "POST", body });
}

export async function parseUrl(url: string): Promise<{
  url: string;
  extracted_text: string;
}> {
  return apiFetch("/media/parse-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export async function translateWord(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const trimmed = text.trim();
  return cachedGeminiCall("word", trimmed, targetLanguage, async () => {
    return apiFetch<TranslationResult>("/ai/translate-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: trimmed,
        target_language: targetLanguage,
      }),
    });
  });
}

export async function sentenceBreakdown(
  sentence: string,
  targetLanguage: string
): Promise<TranslationResult> {
  const trimmed = sentence.trim();
  return cachedGeminiCall("sentence", trimmed, targetLanguage, async () => {
    const data = await apiFetch<{
      original_sentence: string;
      overall_translation: string;
    }>("/ai/sentence-breakdown", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentence: trimmed,
        target_language: targetLanguage,
      }),
    });
    return {
      original: data.original_sentence,
      translation: data.overall_translation,
    };
  });
}

export async function listFlashcards(): Promise<Flashcard[]> {
  return apiFetch<Flashcard[]>("/flashcards/");
}

export async function listDecks(): Promise<string[]> {
  const data = await apiFetch<{ decks: string[] }>("/flashcards/decks");
  return data.decks;
}

export async function addFlashcard(payload: {
  word: string;
  translation: string;
  deck_name: string;
}): Promise<Flashcard> {
  return apiFetch<Flashcard>("/flashcards/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateFlashcardStatus(
  cardId: string,
  status: Flashcard["status"]
): Promise<Flashcard> {
  return apiFetch<Flashcard>(`/flashcards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
