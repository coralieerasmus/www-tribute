"use client";

import { useEffect, useRef, useState } from "react";
import { ASSETS, Img, type GoTo } from "./shared";

/* What each desktop icon says when you double-click it.*/
const ICON_MESSAGES: Record<string, { loading?: string; text: string }> = {
  "My Computer": {
    loading: "Connecting... please wait.",
    text: "Connected! Click Start in the Internet Wizard to go online.",
  },
  "My Documents": { text: "This folder is empty." },
  "Internet Explorer": {
    loading: "Loading... (28.8k modem)",
    text: "Connection failed. Please run the Internet Wizard first.",
  },
  "Network Neighborhood": { text: "No neighbors online." },
  "Recycle Bin": { text: "Recycle Bin is empty." },
};

const LOADING_TIME = 3000; // milliseconds

type Message = { title: string; text: string; loading: boolean };

/* 1995: Windows desktop with the Internet Wizard popup */
export default function Instructions({ goTo }: { goTo: GoTo }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const timer = useRef<number | null>(null);

  // stop the loading timer when leaving the page
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function openIcon(label: string) {
    const info = ICON_MESSAGES[label] ?? { text: "Please wait..." };
    setSelected(label);
    if (timer.current) clearTimeout(timer.current);

    if (info.loading) {
      // first the loading bar, then the final message
      setMessage({ title: label, text: info.loading, loading: true });
      timer.current = window.setTimeout(() => {
        setMessage({ title: label, text: info.text, loading: false });
      }, LOADING_TIME);
    } else {
      setMessage({ title: label, text: info.text, loading: false });
    }
  }

  function closeMessage() {
    if (timer.current) clearTimeout(timer.current);
    setMessage(null);
  }

  return (
    <div
      className="w-desktop"
      style={{ backgroundImage: `url(${ASSETS.wallpaper})` }}
      onClick={(e) => {
        // clicking the empty desktop deselects the icon
        if (e.target === e.currentTarget) setSelected(null);
      }}
    >
      <div className="w-icons">
        {ASSETS.desktopIcons.map((icon) => (
          <button
            key={icon.label}
            type="button"
            className={`w-icon ${selected === icon.label ? "is-selected" : ""}`}
            onClick={() => setSelected(icon.label)}
            onDoubleClick={() => openIcon(icon.label)}
            onKeyDown={(e) => {
              if (e.key === "Enter") openIcon(icon.label);
            }}
          >
            <Img src={icon.src} alt="" />
            <span>{icon.label}</span>
          </button>
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
            <h1 className="w-h-instructions">Welcome to 1995</h1>
            <p>
              This website is a time machine through the history of the
              internet.
            </p>
            <p>
              Complete each task to travel forward in time, and watch the web
              change around you.
            </p>
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
              onClick={() => goTo("chat")}
            >
              <u>S</u>tart
            </button>
          </div>
          <button className="w-btn" type="button">
            Cancel
          </button>
        </div>
      </div>

      {/* small Windows message when you double-click a desktop icon */}
      {message && (
        <div className="w-msg" role="alertdialog" aria-labelledby="w-msg-title">
          <div className="w-titlebar w-msg-titlebar">
            <span id="w-msg-title">{message.title}</span>
            <button
              className="w-msg-x"
              type="button"
              aria-label="Close"
              onClick={closeMessage}
            >
              ×
            </button>
          </div>
          <div className="w-msg-body">
            <span className="w-msg-icon" aria-hidden="true">
              i
            </span>
            <div className="w-msg-content">
              <p>{message.text}</p>
              {message.loading && (
                <div
                  className="w-loadbar"
                  role="progressbar"
                  aria-label="Loading"
                >
                  <div className="w-loadbar-fill" />
                </div>
              )}
            </div>
          </div>
          <div className="w-msg-actions">
            <button
              className="w-btn w-default"
              type="button"
              autoFocus
              onClick={closeMessage}
            >
              {message.loading ? "Cancel" : "OK"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
