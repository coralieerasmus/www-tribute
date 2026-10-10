"use client";

import { useState, type ImgHTMLAttributes } from "react";
import "./retro.css";

const ASSETS = {
  wallpaper: "/assets/desktop.background.png", // desktop background
  wizardImage: "/assets/wizard-globe.png", // computer
  googleLogo: "/assets/GoogleBETA.png", // Google! BETA logo

  desktopIcons: [
    { label: "My Computer", src: "/assets/icons/ComputerICON.png" },
    { label: "My Documents", src: "/assets/icons/DocumentsICON.png" },
    { label: "Internet Explorer", src: "/assets/icons/InternetICON.png" },
    { label: "Network Neighborhood", src: "/assets/icons/NetworkICON.png" },
    { label: "Recycle Bin", src: "/assets/icons/BinICON.png" },
  ],

  startLogo: "/assets/icons/start.png",
  quickLaunch: [
    "/assets/icons/ql-ie.png",
    "/assets/icons/ql-desktop.png",
    "/assets/icons/ql-notepad.png",
    "/assets/icons/ql-channels.png",
  ],
  taskbarApps: [
    { label: "~*~ Donut 404 ~*~ - ...", src: "/assets/icons/InternetICON.png" },
    { label: "Microsoft Word", src: "/assets/icons/word.png" },
    { label: "ICQ", src: "/assets/icons/icq.png" },
    { label: "Winamp", src: "/assets/icons/winamp.png" },
  ],
  volumeIcon: "/assets/icons/volume.png",
};

/* Links on the search results page */
const RESULTS = [
  {
    link: "Pizza Hut.",
    text: " OperationPizzaNet is Pizza Hut's Electronic Storefront. Brought to you by Pizza Hut® and The Santa Cruz Operation®. August 1994",
    href: "#",
  },
  {
    before: "Do not click on this link. ",
    link: "Random Link.",
    text: "",
    href: "#",
  },
  { link: "Internet Info for Real People", text: " by Bob Brand.", href: "#" },
  {
    link: "How to pass Human Centered Design semester",
    text: " by Fontys Students in Eindhoven",
    href: "#",
  },
  {
    before:
      "Brill's Content reviews the best of the web in an article by Noah Robischon",
    link: "Portals/Search Sites",
    text: "",
    href: "#",
    linkOnNewLine: true,
  },
  {
    link: "In Search of Success",
    text: " by David Green of the Independent Network, March 99, 1967.",
    href: "#",
  },
];

type Screen = "instructions" | "google" | "results";

/* An <img> that hides itself if the file doesn't exist yet */
function Img(props: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      {...props}
      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
    />
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("instructions");
  const [query, setQuery] = useState("");

  /* ---------- 1991: desktop instructions---------- */
  if (screen === "instructions") {
    return (
      <div
        className="w-desktop"
        style={{ backgroundImage: `url(${ASSETS.wallpaper})` }}
      >
        <div className="w-icons">
          {ASSETS.desktopIcons.map((icon) => (
            <div className="w-icon" key={icon.label}>
              <Img src={icon.src} alt="" />
              <span>{icon.label}</span>
            </div>
          ))}
        </div>

        <div className="w-window" role="dialog" aria-labelledby="wizard-title">
          <div className="w-titlebar" id="wizard-title">
            Internet Wizard
          </div>

          <div className="w-body">
            <div className="w-art">
              <Img
                src={ASSETS.wizardImage}
                alt="A computer connected to planet Earth"
              />
            </div>

            <div className="w-text w-mono">
              <h1 className="w-h-instructions">Instructions</h1>
              <p>
                You&apos;ve just logged on. The year is 1991, and the World Wide
                Web has only just been born.
              </p>
              <p>
                Your mission:
                <br />
                Travel through the history of the web by completing tasks. Every
                task you finish moves you forward in time, and the website
                changes with you.
              </p>
              <div>
                How it works:
                <ul>
                  <li>
                    Complete the tasks you&apos;re given to unlock the next era.
                  </li>
                  <li>Watch the website grow up around you</li>
                  <li>
                    Check your progress anytime in the Task List to see what
                    you&apos;ve completed and what&apos;s still left.
                  </li>
                </ul>
              </div>
              <p>Ready to surf the web?</p>
            </div>
          </div>

          <hr className="w-divider" />

          <div className="w-actions">
            <div className="w-pair">
              <button className="w-btn" type="button" disabled>
                &lt; <u>B</u>ack
              </button>
              <button
                className="w-btn w-default"
                type="button"
                onClick={() => setScreen("google")}
              >
                <u>S</u>tart
              </button>
            </div>
            <button className="w-btn" type="button">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Google 1999: search page ---------- */
  if (screen === "google") {
    return (
      <main className="g-page">
        <Img className="g-logo" src={ASSETS.googleLogo} alt="Google! BETA" />
        <p className="g-task">Search the web for Pizza Hut</p>

        {/* Whatever the user types, it always goes to the same results page */}
        <form
          className="g-form"
          onSubmit={(e) => {
            e.preventDefault();
            setScreen("results");
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

  /* ---------- Google 1999: results page ---------- */
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
            setScreen("google");
          }}
        >
          Back to Google Search Engine
        </a>

        <ul>
          {RESULTS.map((r) => (
            <li key={r.link}>
              {r.before}
              {r.linkOnNewLine && <br />}
              <a
                href={r.href}
                onClick={(e) => r.href === "#" && e.preventDefault()}
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
