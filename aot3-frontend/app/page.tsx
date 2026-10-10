export default function Home() {
  return (
    <main className = "home">
      <nav className="navbar">
        <a className="logo" href="/">AoT^3</a>

        <a className="nav-link" href="/flashcards">
          My Flashcards
        </a>
      </nav>

      <section className="hero">
        <p className="eyebrow">
          triple your tongues!
        </p>

        <h1>
          do what you want to do
          <br />
          <span>do it</span>
        </h1>

        <p className="description">
          learn a new language
        </p>

        <form action="/viewer" className="media-form">
          <label htmlFor="media-url">
            what language bro?
          </label>

          <input
          id="media-url"
          name="url"
          type="url"
          placeholder="paste a video or article link here yo"
          required
          />

          <div className = "language-row">
            <div className="language-field">
              <label htmlFor="native-language">
                i speak...
              </label>
              <select id="native-language" name="native">
                <option value="english">english</option>
                <option value="spanish">spanish</option>
                <option value="japanese">japanese</option>
                <option value="french">french</option>
              </select>
            </div>

            <div className="language-field">
              <label htmlFor="target-language">
                i wanna learn
              </label>
              <select id="target-language" name="target">
                <option value="japanese">japanese</option>
                <option value="spanish">spanish</option>
                <option value="french">french</option>
                <option value="english">english</option>
              </select>
            </div>
          </div>

          <button type="submit">
            start to learn <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="footnote">
          ai ai ai
        </p>
      </section>
    </main>
  );
}