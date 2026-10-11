"use client";

import { useEffect, useRef, useState } from "react";
import { Img } from "./shared";

/* ▼ Sound + image files for the easter eggs */
const NOTIFICATION_SOUND = "/assets/notification.mp3"; // short "ding" for each feedpulse request
const DANCE_MUSIC = "/assets/dance.mp3"; // music for the dancing baby
const DANCING_BABY = "/assets/dancing-baby.gif"; // the dancing baby

/* Easter egg 1: feedpulse requests that come in faster and faster */
const SPAM = [
  "@student_42 requested a feedpulse",
  "@Jasper2005 requested a feedpulse",
  "@xX_Emma_Xx requested a feedpulse",
  "@group4 requested a feedpulse (URGENT!!)",
  "@student_42 requested ANOTHER feedpulse",
  "@whole_class requested a feedpulse",
  "@your_mom requested a feedpulse",
  "@student_42 is typing...",
];
const SPAM_DELAYS = [0, 900, 750, 600, 480, 380, 300, 240]; // milliseconds between each one

/* The 3 blog posts, each with its own easter egg */
export default function BlogEntries({ titles }: { titles: string[] }) {
  const timers = useRef<number[]>([]);
  const danceAudio = useRef<HTMLAudioElement | null>(null);

  // 1. feedpulse spam
  const [spam, setSpam] = useState<string[]>([]);
  const [spamRunning, setSpamRunning] = useState(false);
  const [leftChat, setLeftChat] = useState(false);

  // 2. UFO
  const [ufo, setUfo] = useState(false);
  const [ufoNote, setUfoNote] = useState(false);

  // 3. dancing baby
  const [baby, setBaby] = useState(false);

  // prepare the dance music once, and clean everything up when leaving the page
  useEffect(() => {
    const audio = new Audio(DANCE_MUSIC);
    audio.loop = true;
    danceAudio.current = audio;
    const pending = timers.current;
    return () => {
      audio.pause();
      pending.forEach((t) => clearTimeout(t));
    };
  }, []);

  function later(action: () => void, ms: number) {
    timers.current.push(window.setTimeout(action, ms));
  }

  function playDing() {
    const ding = new Audio(NOTIFICATION_SOUND);
    ding.play().catch(() => {});
  }

  function startSpam() {
    if (spamRunning) return;
    setSpamRunning(true);
    setSpam([]);
    setLeftChat(false);

    let time = 0;
    SPAM.forEach((message, i) => {
      time += SPAM_DELAYS[i];
      later(() => {
        setSpam((current) => [...current, message]);
        playDing();
      }, time);
    });
    later(() => {
      setLeftChat(true);
      playDing();
    }, time + 900);
    later(() => {
      setSpam([]);
      setLeftChat(false);
      setSpamRunning(false);
    }, time + 4500);
  }

  function startUfo() {
    if (ufo) return;
    setUfo(true);
    setUfoNote(false);
    later(() => {
      setUfo(false);
      setUfoNote(true);
    }, 4000);
    later(() => setUfoNote(false), 8000);
  }

  function startBaby() {
    setBaby(true);
    const audio = danceAudio.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  function stopBaby() {
    setBaby(false);
    danceAudio.current?.pause();
  }

  const eggs = [startSpam, startUfo, startBaby];

  return (
    <>
      <ul className="m-blog">
        {titles.map((title, i) => (
          <li key={title} className={i === 1 ? "m-ufo-li" : undefined}>
            {i === 1 && ufo && (
              <span className="m-ufo" aria-hidden="true">
                🛸
                <span className="m-ufo-beam" />
              </span>
            )}
            <a
              href="#"
              className={i === 1 && ufo ? "m-abducted" : undefined}
              onClick={(e) => {
                e.preventDefault();
                eggs[i]?.();
              }}
            >
              {title}
            </a>
            <span className="m-view-more">(view more)</span>
            {i === 1 && ufoNote && (
              <span className="m-ufo-note">
                Reason #1: they wanted to read this blog. 👽
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* 1. feedpulse notifications */}
      {(spam.length > 0 || leftChat) && (
        <div className="m-spam" role="status">
          {spam.map((message, i) => (
            <div key={i} className="m-spam-item">
              <b>New Feedpulse Request</b>
              <span>{message}</span>
            </div>
          ))}
          {leftChat && (
            <div className="m-spam-item m-spam-final">
              <b>Stansino has left the chat.</b>
            </div>
          )}
        </div>
      )}

      {/* 3. dancing baby */}
      {baby && (
        <div
          className="m-baby"
          onClick={stopBaby}
          role="dialog"
          aria-label="Dancing baby"
        >
          <button
            type="button"
            className="m-baby-close"
            aria-label="Stop dancing"
            onClick={stopBaby}
          >
            ×
          </button>
          <p className="m-baby-text">HAVE YOU TRIED DANCING?</p>
          <div className="m-baby-dancer">
            <Img src={DANCING_BABY} alt="A dancing baby" />
          </div>
          <p className="m-baby-hint">(click anywhere to stop)</p>
        </div>
      )}
    </>
  );
}
