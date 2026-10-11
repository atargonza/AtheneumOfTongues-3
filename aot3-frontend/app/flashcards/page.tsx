"use client";

import {
  listFlashcards,
  updateFlashcardStatus,
} from "@/src/services/api";
import type { Flashcard, FlashcardStatusFilter } from "@/src/types";
import { useCallback, useEffect, useMemo, useState } from "react";

function groupByDeck(cards: Flashcard[]): Record<string, Flashcard[]> {
  return cards.reduce<Record<string, Flashcard[]>>((groups, card) => {
    const key = card.deck_name || "General";
    groups[key] = groups[key] ?? [];
    groups[key].push(card);
    return groups;
  }, {});
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [filter, setFilter] = useState<FlashcardStatusFilter>("all");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const loadCards = useCallback(async () => {
    try {
      const data = await listFlashcards();
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load flashcards.");
    }
  }, []);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  const visibleCards = useMemo(() => {
    if (filter === "all") return cards;
    return cards.filter((card) => card.status === filter);
  }, [cards, filter]);

  const decks = groupByDeck(visibleCards);

  async function toggleStatus(card: Flashcard) {
    const next = card.status === "mastered" ? "needs_review" : "mastered";
    try {
      const updated = await updateFlashcardStatus(card.id, next);
      setCards((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update card.");
    }
  }

  return (
    <main className="flashcards-page">
      <header className="reader-header">
        <a className="reader-brand" href="/">
          Atheneum of Tongues<sup>3</sup>
        </a>
        <span className="reader-header-label">FLASHCARDS</span>
      </header>

      <section className="flashcards-toolbar">
        <div className="input-tabs">
          {(
            [
              ["all", "All Cards"],
              ["needs_review", "Needs Review"],
              ["mastered", "Mastered"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "active-tab" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <a className="flashcards-link" href="/">
          ← Read media
        </a>
      </section>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {cards.length === 0 ? (
        <div className="empty-word-state">
          <h3>No decks yet</h3>
          <p>
            Open an article, translate a word, and add it to a deck to start
            reviewing.
          </p>
          <a className="reader-back-link" href="/">
            Start reading →
          </a>
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="empty-word-state">
          <h3>No cards in this filter</h3>
          <p>Try “All Cards” or add more vocabulary from the reader.</p>
        </div>
      ) : (
        Object.entries(decks).map(([deckName, deckCards]) => (
          <section key={deckName} className="deck-section">
            <h2 className="deck-title">{deckName}</h2>
            <div className="deck-grid">
              {deckCards.map((card) => {
                const isFlipped = Boolean(flipped[card.id]);
                return (
                  <article key={card.id} className="flashcard-wrap">
                    <button
                      type="button"
                      className={`flip-card ${isFlipped ? "is-flipped" : ""}`}
                      onClick={() =>
                        setFlipped((previous) => ({
                          ...previous,
                          [card.id]: !previous[card.id],
                        }))
                      }
                      aria-label={
                        isFlipped
                          ? `Original: ${card.word}`
                          : `Translation: ${card.translation}`
                      }
                    >
                      <span className="flip-face flip-front">
                        {card.translation}
                      </span>
                      <span className="flip-face flip-back">{card.word}</span>
                    </button>
                    <button
                      type="button"
                      className="card-status-button"
                      onClick={() => void toggleStatus(card)}
                    >
                      {card.status === "mastered"
                        ? "Mastered · mark for review"
                        : "Needs review · mark mastered"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
