"use client";

import { useArticle } from "@/src/context/ArticleContext";
import { debounce } from "@/src/lib/debounce";
import {
  addFlashcard,
  listDecks,
  translateWord,
} from "@/src/services/api";
import { TARGET_LANGUAGES, type TranslationResult } from "@/src/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WORD_SPLIT = /(\s+)/;
const STRIP_EDGES = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu;

function cleanToken(raw: string): string {
  return raw.replace(STRIP_EDGES, "");
}

export default function ViewerPage() {
  const {
    extractedText,
    sourceLabel,
    title,
    targetLanguage,
    hydrated,
    setArticle,
  } = useArticle();
  const [selectedText, setSelectedText] = useState("");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState("");
  const [decks, setDecks] = useState<string[]>([]);
  const [deckName, setDeckName] = useState("General");
  const [saveMessage, setSaveMessage] = useState("");
  const [popover, setPopover] = useState<{ top: number; left: number } | null>(
    null
  );
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listDecks()
      .then((names) => {
        setDecks(names);
        if (names[0]) setDeckName(names[0]);
      })
      .catch(() => {
        /* decks can stay empty until a card is saved */
      });
  }, []);

  const runTranslate = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setIsTranslating(true);
      setError("");
      setSaveMessage("");

      try {
        const translation = await translateWord(trimmed, targetLanguage);
        setResult(translation);
      } catch (err) {
        setResult(null);
        setError(
          err instanceof Error ? err.message : "Translation failed."
        );
      } finally {
        setIsTranslating(false);
      }
    },
    [targetLanguage]
  );

  const debouncedTranslate = useMemo(
    () =>
      debounce((text: string) => {
        void runTranslate(text);
      }, 250),
    [runTranslate]
  );

  useEffect(() => {
    return () => debouncedTranslate.cancel();
  }, [debouncedTranslate]);

  function selectText(text: string, origin?: HTMLElement) {
    const cleaned = cleanToken(text) || text.trim();
    if (!cleaned) return;
    setSelectedText(cleaned);
    setResult(null);
    setError("");
    setSaveMessage("");

    if (origin && articleRef.current) {
      const articleBox = articleRef.current.getBoundingClientRect();
      const wordBox = origin.getBoundingClientRect();
      setPopover({
        top: wordBox.bottom - articleBox.top + articleRef.current.scrollTop + 8,
        left: Math.min(
          Math.max(8, wordBox.left - articleBox.left),
          Math.max(8, articleRef.current.clientWidth - 328)
        ),
      });
    }
  }

  function handleWordClick(
    event: React.MouseEvent<HTMLButtonElement>,
    rawWord: string
  ) {
    selectText(rawWord, event.currentTarget);
  }

  function handleMouseUp() {
    const selection = window.getSelection();
    const raw = selection?.toString().trim() ?? "";
    if (!raw || !articleRef.current) return;
    if (!selection?.anchorNode || !articleRef.current.contains(selection.anchorNode)) {
      return;
    }
    if (!raw.includes(" ") && !raw.includes("\n")) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const articleBox = articleRef.current.getBoundingClientRect();
    setSelectedText(raw.replace(/\s+/g, " "));
    setResult(null);
    setError("");
    setSaveMessage("");
    setPopover({
      top: rect.bottom - articleBox.top + articleRef.current.scrollTop + 8,
      left: Math.max(8, rect.left - articleBox.left),
    });
  }

  function handleTranslateClick() {
    if (!selectedText) return;
    debouncedTranslate(selectedText);
  }

  async function handleAddToFlashcards() {
    if (!result) return;
    const name = deckName.trim() || "General";
    try {
      await addFlashcard({
        word: result.original,
        translation: result.translation,
        deck_name: name,
      });
      if (!decks.includes(name)) {
        setDecks((previous) => [...previous, name]);
      }
      setSaveMessage(`Saved to ${name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save flashcard.");
    }
  }

  if (!hydrated) {
    return (
      <main className="reader-page">
        <header className="reader-header">
          <a className="reader-brand" href="/">
            Atheneum of Tongues<sup>3</sup>
          </a>
        </header>
      </main>
    );
  }

  if (!extractedText) {
    return (
      <main className="reader-page">
        <header className="reader-header">
          <a className="reader-brand" href="/">
            Atheneum of Tongues<sup>3</sup>
          </a>
        </header>
        <div className="empty-word-state">
          <h3>No article loaded</h3>
          <p>Upload a file or paste a URL on the home page to start reading.</p>
          <a className="reader-back-link" href="/">
            ← Back to the atheneum
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="reader-page">
      <header className="reader-header">
        <a className="reader-brand" href="/">
          Atheneum of Tongues<sup>3</sup>
        </a>

        <span className="reader-header-label">MEDIA READER</span>
      </header>

      <div className="reader-layout">
        <section className="article-side">
          <div className="mini-browser">
            <div className="browser-toolbar">
              <div className="browser-dots">
                <span />
                <span />
                <span />
              </div>

              <div className="browser-address">{sourceLabel || "article"}</div>
            </div>

            <div
              className="mini-browser-content"
              ref={articleRef}
              onMouseUp={handleMouseUp}
            >
              <p className="site-category">ARTICLES · INTERACTIVE READER</p>

              <h1 className="mini-article-title">{title || "Your article"}</h1>

              <p className="mini-article-meta">
                Click a word or highlight a phrase, then press Translate.
              </p>

              <div className="mini-article-body">
                {extractedText.split("\n").map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>
                    {paragraph.split(WORD_SPLIT).map((part, index) => {
                      if (!part.trim()) {
                        return <span key={index}>{part}</span>;
                      }

                      const cleaned = cleanToken(part);
                      const isSelected =
                        cleaned.toLowerCase() === selectedText.toLowerCase();

                      return (
                        <button
                          key={index}
                          type="button"
                          className={`article-word ${
                            isSelected ? "selected-word" : ""
                          }`}
                          onClick={(event) => handleWordClick(event, part)}
                          aria-label={`Select ${cleaned}`}
                        >
                          {part}
                        </button>
                      );
                    })}
                  </p>
                ))}
              </div>

              {popover && selectedText && (
                <div
                  className="translation-popover"
                  style={{ top: popover.top, left: popover.left }}
                >
                  <p className="word-label">SELECTED</p>
                  <p className="popover-original">{selectedText}</p>
                  <button
                    type="button"
                    className="save-word-button"
                    onClick={handleTranslateClick}
                    disabled={isTranslating}
                  >
                    {isTranslating ? "Translating…" : "Translate"}
                  </button>
                  {result && (
                    <>
                      <p className="word-label">TRANSLATION</p>
                      <p className="popover-translation">{result.translation}</p>
                      <label className="translation-label" htmlFor="deck-select">
                        Deck
                      </label>
                      <input
                        id="deck-select"
                        className="translation-input"
                        list="deck-options"
                        value={deckName}
                        onChange={(event) => setDeckName(event.target.value)}
                        placeholder="Existing or new deck"
                      />
                      <datalist id="deck-options">
                        {decks.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        className="save-word-button"
                        onClick={() => void handleAddToFlashcards()}
                      >
                        Add to Flashcards
                      </button>
                      {saveMessage && (
                        <p className="saved-message">{saveMessage}</p>
                      )}
                    </>
                  )}
                  {error && (
                    <p role="alert" className="form-error">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="translation-side">
          <div className="translation-card">
            <div className="translation-heading">
              <span className="translation-icon">文</span>
              <div>
                <p className="translation-eyebrow">YOUR VOCABULARY</p>
                <h2>Word explorer</h2>
              </div>
            </div>

            <label className="translation-label" htmlFor="viewer-language">
              Translate into
            </label>
            <select
              id="viewer-language"
              className="translation-input"
              value={targetLanguage}
              onChange={(event) =>
                setArticle({ targetLanguage: event.target.value })
              }
            >
              {TARGET_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>

            {!selectedText ? (
              <div className="empty-word-state">
                <span className="word-placeholder-icon">Aa</span>
                <h3>Discover a new word</h3>
                <p>
                  Click any word or highlight a phrase, then click Translate.
                  Cached words skip Gemini.
                </p>
              </div>
            ) : (
              <div className="word-details">
                <p className="word-label">SELECTED</p>
                <h3 className="selected-word-title">{selectedText}</h3>
                {result && (
                  <>
                    <p className="word-label">TRANSLATION</p>
                    <p className="selected-word-title">{result.translation}</p>
                    <label className="translation-label" htmlFor="sidebar-deck">
                      Deck
                    </label>
                    <input
                      id="sidebar-deck"
                      className="translation-input"
                      list="deck-options"
                      value={deckName}
                      onChange={(event) => setDeckName(event.target.value)}
                      placeholder="Existing or new deck"
                    />
                    <button
                      type="button"
                      className="save-word-button"
                      onClick={() => void handleAddToFlashcards()}
                    >
                      Add to Flashcards
                    </button>
                    {saveMessage && (
                      <p className="saved-message">{saveMessage}</p>
                    )}
                  </>
                )}
                <button
                  type="button"
                  className="save-word-button"
                  onClick={handleTranslateClick}
                  disabled={isTranslating}
                >
                  {isTranslating ? "Translating…" : "Translate"}
                </button>
                <a className="reader-back-link" href="/flashcards">
                  Open flashcards →
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
