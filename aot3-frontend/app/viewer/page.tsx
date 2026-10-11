
"use client";

import { useEffect, useState } from "react";

const sampleTitle = "El aceite de coco: ¿es realmente saludable?";

const sampleArticle = `En los últimos años, el coco y el aceite de coco se han puesto de moda. A menudo se presentan como alimentos saludables, pero sus beneficios no siempre son tan claros. Para comprender sus efectos, debemos analizar sus propiedades y cómo influyen en nuestra alimentación diaria.

El aceite de coco contiene una gran cantidad de grasas saturadas. Aunque algunas personas lo consideran una alternativa natural a otros aceites, es importante consumirlo con moderación y conocer las recomendaciones nutricionales.

Una alimentación equilibrada incluye una variedad de frutas, verduras, cereales integrales y fuentes saludables de grasas. Ningún alimento por sí solo garantiza una buena salud.`;

type SavedWord = {
  word: string;
  meaning: string;
};

export default function ViewerPage() {
  const [article, setArticle] = useState(sampleArticle);
  const [title, setTitle] = useState(sampleTitle);
  const [articleUrl, setArticleUrl] = useState("your-article.example");
  const [selectedWord, setSelectedWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  // Read the URL only after the component mounts in the browser.
  // This prevents the server/client hydration mismatch.
  
useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  setArticleUrl(params.get("url") || "your-article.example");

  const source = params.get("source");

  if (source === "file") {
    const uploadedText = sessionStorage.getItem("articleText");

    if (uploadedText) {
      setArticle(uploadedText);
      setTitle("Your uploaded article");
    }
  }
}, []);


  function handleWordClick(rawWord: string) {
    const word = rawWord.replace(
      /^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu,
      ""
    );

    if (!word) return;

    setSelectedWord(word);

    const existingWord = savedWords.find(
      (item) => item.word.toLowerCase() === word.toLowerCase()
    );

    setTranslation(existingWord?.meaning ?? "");
  }

  function saveWord() {
    if (!selectedWord || !translation.trim()) return;

    setSavedWords((previous) => {
      const exists = previous.some(
        (item) =>
          item.word.toLowerCase() === selectedWord.toLowerCase()
      );

      if (exists) {
        return previous.map((item) =>
          item.word.toLowerCase() === selectedWord.toLowerCase()
            ? { ...item, meaning: translation.trim() }
            : item
        );
      }

      return [
        ...previous,
        {
          word: selectedWord,
          meaning: translation.trim(),
        },
      ];
    });
  }

  return (
    <main className="reader-page">
      <header className="reader-header">
        <a className="reader-brand" href="/">
          Atheneum of Tongues<sup>3</sup>
        </a>

        <span className="reader-header-label">
          MEDIA READER
        </span>
      </header>

      <div className="reader-layout">
        {/* LEFT SIDE: ARTICLE */}
        <section className="article-side">
          <div className="mini-browser">
            <div className="browser-toolbar">
              <div className="browser-dots">
                <span />
                <span />
                <span />
              </div>

              <div className="browser-address">
                {articleUrl}
              </div>
            </div>

            <div className="mini-browser-content">
              <p className="site-category">
                ARTICLES · CULTURE · HEALTH
              </p>

              <h1 className="mini-article-title">
                {title}
              </h1>

              <p className="mini-article-meta">
                Interactive reading mode · Select any word
              </p>

              <div className="mini-article-body">
                {article.split("\n").map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>
                    {paragraph
                      .split(/(\s+)/)
                      .map((part, index) => {
                        // Preserve whitespace between words.
                        if (!part.trim()) {
                          return <span key={index}>{part}</span>;
                        }

                        const cleanWord = part.replace(
                          /^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu,
                          ""
                        );

                        const isSelected =
                          cleanWord.toLowerCase() ===
                          selectedWord.toLowerCase();

                        return (
                          <button
                            key={index}
                            type="button"
                            className={`article-word ${
                              isSelected ? "selected-word" : ""
                            }`}
                            onClick={() => handleWordClick(part)}
                            aria-label={`Translate ${cleanWord}`}
                            title={`Click to translate: ${cleanWord}`}
                          >
                            {part}
                          </button>
                        );
                      })}
                  </p>
                ))}
              </div>

              {/* Temporary editing controls for testing */}
              <div className="article-edit">
                <details>
                  <summary>Try a different article text</summary>

                  <label htmlFor="article-title-input">
                    Article title
                  </label>

                  <input
                    id="article-title-input"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />

                  <label htmlFor="article-text-input">
                    Article text
                  </label>

                  <textarea
                    id="article-text-input"
                    value={article}
                    onChange={(event) => {
                      setArticle(event.target.value);
                      setSelectedWord("");
                      setTranslation("");
                    }}
                  />
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT SIDE: WORD EXPLORER */}
        <aside className="translation-side">
          <div className="translation-card">
            <div className="translation-heading">
              <span className="translation-icon">文</span>

              <div>
                <p className="translation-eyebrow">
                  YOUR VOCABULARY
                </p>

                <h2>Word explorer</h2>
              </div>
            </div>

            {!selectedWord ? (
              <div className="empty-word-state">
                <span className="word-placeholder-icon">Aa</span>

                <h3>Discover a new word</h3>

                <p>
                  Click any word in the article to explore its
                  meaning and add it to your vocabulary.
                </p>
              </div>
            ) : (
              <div className="word-details">
                <p className="word-label">SELECTED WORD</p>

                <h3 className="selected-word-title">
                  {selectedWord}
                </h3>

                <label
                  className="translation-label"
                  htmlFor="translation-input"
                >
                  Translation or meaning
                </label>

                <input
                  id="translation-input"
                  className="translation-input"
                  value={translation}
                  onChange={(event) =>
                    setTranslation(event.target.value)
                  }
                  placeholder="Enter a translation..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveWord();
                  }}
                />

                <button
                  type="button"
                  className="save-word-button"
                  onClick={saveWord}
                  disabled={!translation.trim()}
                >
                  + Save to vocabulary
                </button>

                {savedWords.some(
                  (item) =>
                    item.word.toLowerCase() ===
                    selectedWord.toLowerCase()
                ) && (
                  <p className="saved-message">
                    ✓ Saved to your vocabulary
                  </p>
                )}
              </div>
            )}

            <div className="saved-vocabulary">
              <div className="saved-vocabulary-heading">
                <h3>Saved words</h3>
                <span>{savedWords.length}</span>
              </div>

              {savedWords.length === 0 ? (
                <p className="saved-empty">
                  Words you save will appear here.
                </p>
              ) : (
                <ul className="saved-list">
                  {savedWords.map((item) => (
                    <li key={item.word}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWord(item.word);
                          setTranslation(item.meaning);
                        }}
                      >
                        <span>{item.word}</span>
                        <span>{item.meaning}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
