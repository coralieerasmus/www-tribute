"use client";

import { useEffect, useState } from "react";
import { ASSETS, Img, type GoTo } from "./shared";

/* Easter egg for "I'm feeling lucky": a glitch through the future eras.*/
const GLITCH_FRAMES = [
  { year: "2006", label: "MySpace", theme: "g-era-2006", ms: 150 },
  { year: "2012", label: "YouTube", theme: "g-era-2012", ms: 150 },
  { year: "2019", label: "Instagram", theme: "g-era-2019", ms: 150 },
  { year: "2026", label: "AI", theme: "g-era-2026", ms: 150 },
  { year: "2006", label: "MySpace", theme: "g-era-2006", ms: 150 },
  { year: "2012", label: "YouTube", theme: "g-era-2012", ms: 150 },
  { year: "2019", label: "Instagram", theme: "g-era-2019", ms: 150 },
  { year: "2026", label: "AI", theme: "g-era-2026", ms: 150 },
  { year: "", label: "", theme: "g-era-warning", ms: 3700 },
];

/* 1999: Google search page. Whatever the user types, it always goes to the results page */
export default function GoogleSearch({ goTo }: { goTo: GoTo }) {
  const [query, setQuery] = useState("");
  const [glitchStep, setGlitchStep] = useState<number | null>(null);

  // moves the glitch to the next frame, and stops after the last one
  useEffect(() => {
    if (glitchStep === null) return;
    const timer = setTimeout(() => {
      setGlitchStep(
        glitchStep + 1 < GLITCH_FRAMES.length ? glitchStep + 1 : null,
      );
    }, GLITCH_FRAMES[glitchStep].ms);
    return () => clearTimeout(timer);
  }, [glitchStep]);

  const frame = glitchStep === null ? null : GLITCH_FRAMES[glitchStep];

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
          onKeyDown={() => new Audio("/assets/key.mp3").play().catch(() => {})}
          autoComplete="off"
          autoFocus
        />
        <div className="g-buttons">
          <button className="g-btn" type="submit">
            Google Search
          </button>
          <button
            className="g-btn"
            type="button"
            onClick={() => setGlitchStep(0)}
          >
            I&apos;m feeling lucky
          </button>
        </div>
      </form>

      <a className="g-more" href="#" onClick={(e) => e.preventDefault()}>
        More Google!
      </a>
      <p className="g-copy">Copyright © 1999 Google Inc.</p>

      {/* the time glitch */}
      {frame && (
        <div className={`g-glitch ${frame.theme}`} role="alert">
          {frame.theme === "g-era-warning" ? (
            <div className="g-bsod">
              <p className="g-bsod-title">WINDOWS</p>
              <p>A fatal exception LUCK has occurred at 1999:0067.</p>
              <p>
                WARNING: Too much luck detected.
                <br />
                Time travel unstable!
              </p>
              <p className="g-bsod-blink">Returning you to 1999...</p>
            </div>
          ) : (
            <div>
              <p className="g-glitch-year">{frame.year}</p>
              <p className="g-glitch-label">{frame.label}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
