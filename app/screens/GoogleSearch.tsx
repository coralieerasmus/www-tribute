"use client";

import { useState } from "react";
import { ASSETS, Img, type GoTo } from "./shared";

/* 1999: Google search page. Whatever the user types, it always goes to the results page */
export default function GoogleSearch({ goTo }: { goTo: GoTo }) {
  const [query, setQuery] = useState("");

  return (
    <main className="g-page">
      <Img className="g-logo" src={ASSETS.googleLogo} alt="Google! BETA" />
      <p className="g-task">Search the web for Pizza Hut</p>

      <form
        className="g-form"
        onSubmit={(e) => {
          e.preventDefault();
          goTo("results");
        }}
      >
        <label htmlFor="g-search" className="g-hidden">
          Search
        </label>
        <input
          id="g-search"
          className="g-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <div className="g-buttons">
          <button className="g-btn" type="submit">
            Google Search
          </button>
          <button className="g-btn" type="submit">
            I&apos;m feeling lucky
          </button>
        </div>
      </form>

      <a className="g-more" href="#" onClick={(e) => e.preventDefault()}>
        More Google!
      </a>
      <p className="g-copy">Copyright © 1999 Google Inc.</p>
    </main>
  );
}
