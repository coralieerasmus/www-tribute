"use client";

import { ASSETS, Img, type GoTo } from "./shared";

/* 1991: Windows desktop with the Internet "Instructions" popup */
export default function Instructions({ goTo }: { goTo: GoTo }) {
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
    </div>
  );
}
