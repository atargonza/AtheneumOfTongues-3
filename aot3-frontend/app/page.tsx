
"use client";

import { useRef, useState } from "react";

export default function HomePage() {
  const [inputMode, setInputMode] = useState<"url" | "file">("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (inputMode === "url") {
      const form = event.currentTarget;
      const urlInput = form.elements.namedItem("url") as HTMLInputElement;
      const url = urlInput.value.trim();

      if (!url) {
        setError("Please enter an article URL.");
        return;
      }

      window.location.href = `/viewer?url=${encodeURIComponent(url)}`;
      return;
    }

    if (!selectedFile) {
      setError("Please choose a PDF or TXT file.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // This endpoint must be implemented by your backend.
      const response = await fetch("/api/upload-article", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload is not connected to the backend yet.");
      }

      const result = await response.json();

      if (result.text) {
        sessionStorage.setItem("articleText", result.text);
      }

      window.location.href = "/viewer?source=file";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading the file."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="home">
      <nav className="navbar">
        <div />
        <div />
      </nav>

      <section className="hero">
        <div className="title-container">
          <p className="eyebrow">
            Atheneum of Tongues<sup>3</sup>
          </p>

          <p className="title-tagline">
            See the world in words, see words in the world.
          </p>
        </div>

        <form
          className="media-form"
          onSubmit={handleSubmit}
        >
          <label className="journey-text">
            Venture into the atheneum and start your learning journey.
          </label>

          <div className="input-tabs">
            <button
              type="button"
              className={inputMode === "url" ? "active-tab" : ""}
              aria-pressed={inputMode === "url"}
              onClick={() => {
                setInputMode("url");
                setError("");
              }}
            >
              Article URL
            </button>

            <button
              type="button"
              className={inputMode === "file" ? "active-tab" : ""}
              aria-pressed={inputMode === "file"}
              onClick={() => {
                setInputMode("file");
                setError("");
              }}
            >
              PDF / TXT
            </button>
          </div>

          {inputMode === "url" ? (
            <div className="url-row">
              <input
                id="media-url"
                name="url"
                type="url"
                placeholder="Paste an article URL here..."
                required
              />

              <button
                type="submit"
                className="send-button"
                aria-label="Open article"
              >
                <img src="background.jpg" alt="" />
              </button>
            </div>
          ) : (
            <div className="file-upload">
              <input
                ref={fileInputRef}
                id="article-file"
                name="articleFile"
                type="file"
                accept=".pdf,.txt,application/pdf,text/plain"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setError("");
                }}
              />

              <p>Supported formats: PDF and TXT</p>

              {selectedFile && (
                <p className="selected-file">
                  Selected: {selectedFile.name}
                </p>
              )}

              <button
                type="submit"
                className="upload-submit"
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Open file →"}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </form>

        <a href="/flashcards" className="flashcards-link">
          Go to flashcards →
        </a>

        <p className="footnote">
          ai ai ai
        </p>
      </section>
    </main>
  );
}
