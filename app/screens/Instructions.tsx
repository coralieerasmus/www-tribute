"use client";

import { useState } from "react";
import { ASSETS, Img, type GoTo } from "./shared";

/* What each desktop icon says when you double-click it */
const ICON_MESSAGES: Record<string, string> = {
  "My Computer": "Connecting... please wait.",
  "My Documents": "This folder is empty.",
  "Internet Explorer": "Not invented yet. Try 1995.",
  "Network Neighborhood": "No neighbors online.",
  "Recycle Bin": "Recycle Bin is empty.",
};

/* 1991: Windows desktop with the Internet Wizard "Instructions" popup */
export default function Instructions({ goTo }: { goTo: GoTo }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    title: string;
    text: string;
  } | null>(null);

  function openIcon(label: string) {
    setSelected(label);
    setMessage({
      title: label,
      text: ICON_MESSAGES[label] ?? "Please wait...",
    });
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
            <h1 className="w-h-instructions">Instructions</h1>
            <p>
              You&apos;ve just logged on. The year is 1991, and the World Wide
              Web has only just been born.
            </p>
            <p>
              Your mission:
              <br />
              Travel through the history of the web by completing tasks. Every
              task you finish moves you forward in time, and the website changes
              with you.
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
              onClick={() => goTo("google")}
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
              onClick={() => setMessage(null)}
            >
              ×
            </button>
          </div>
          <div className="w-msg-body">
            <span className="w-msg-icon" aria-hidden="true">
              i
            </span>
            <p>{message.text}</p>
          </div>
          <div className="w-msg-actions">
            <button
              className="w-btn w-default"
              type="button"
              autoFocus
              onClick={() => setMessage(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
