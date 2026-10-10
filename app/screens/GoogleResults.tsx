"use client";

import { ASSETS, Img, type GoTo } from "./shared";

type Result = {
  before?: string;
  link: string;
  text?: string;
  newLine?: boolean;
};

/* Every link on this page opens the Pizza Hut website */
const RESULTS: Result[] = [
  {
    link: "Pizza Hut.",
    text: " OperationPizzaNet is Pizza Hut's Electronic Storefront. Brought to you by Pizza Hut® and The Santa Cruz Operation®. August 1994",
  },
  { before: "Do not click on this link. ", link: "Random Link." },
  { link: "Internet Info for Real People", text: " by Bob Brand." },
  {
    link: "How to pass Human Centered Design semester",
    text: " by Fontys Students in Eindhoven",
  },
  {
    before:
      "Brill's Content reviews the best of the web in an article by Noah Robischon",
    link: "Portals/Search Sites",
    newLine: true,
  },
  {
    link: "In Search of Success",
    text: " by David Green of the Independent Network, March 99, 1967.",
  },
];

/* 1999: Google search results page */
export default function GoogleResults({ goTo }: { goTo: GoTo }) {
  return (
    <main className="g-page g-results-page">
      <Img
        className="g-logo g-logo-small"
        src={ASSETS.googleLogo}
        alt="Google! BETA"
      />

      <div className="g-results">
        <a
          className="g-back"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goTo("google");
          }}
        >
          Back to Google Search Engine
        </a>

        <ul>
          {RESULTS.map((r) => (
            <li key={r.link}>
              {r.before}
              {r.newLine && <br />}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goTo("pizzahut");
                }}
              >
                {r.link}
              </a>
              {r.text}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
