"use client";

import { useEffect, useRef, useState } from "react";
import { type GoTo } from "./shared";

/* 1997: chatting with CyberErik97 on ICQ (the first big chat app, 1996).
   Erik tells you to search for pizza on this new thing called Google. */

const FRIEND = "CyberErik97";
const YOU = "You";
const ERA_YEAR = 1997;

/* The conversation, step by step.
   "says" = what Erik types. "replies" = the 3 buttons you can click,
   each with Erik's answer. The last step has no replies: it shows the Google button. */
const STEPS = [
  {
    says: ["hey!! u finally got the internet?? :)"],
    replies: [
      {
        text: "yes!! just connected",
        answer: "welcome 2 the world wide web!!!",
      },
      { text: "who is this??", answer: "its Erik lol. u added me yesterday" },
      {
        text: "brb my mom needs the phone",
        answer: "NOOO dont hang up the phone line!!",
      },
    ],
  },
  {
    says: [
      "im SO hungry",
      "did u know u can order pizza ON THE INTERNET now??",
    ],
    replies: [
      {
        text: "no way, online??",
        answer: "YES WAY. its 1997, everything is online",
      },
      { text: "how???", answer: "easy, u just have to find the website" },
      { text: "just call them lol", answer: "calling is sooo 1994" },
    ],
  },
  {
    says: [
      'go to Google and search "Pizza Hut"',
      "its this new search engine. trust me",
      "gtg, my brother needs the computer. cya!!",
    ],
    replies: [],
  },
];

const TYPE_TIME = 2600; // milliseconds between Erik's messages (higher = slower)

/* Today's date and time, but in 1997 */
function eraNow() {
  const d = new Date();
  d.setFullYear(ERA_YEAR);
  return d;
}
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

type Line = { from: string; text: string; time: string };

export default function Chat({ goTo }: { goTo: GoTo }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [step, setStep] = useState(0);
  const [canReply, setCanReply] = useState(false);
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(eraNow());
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const typingSound = useRef<HTMLAudioElement | null>(null);

  function addLine(from: string, text: string) {
    setLines((old) => [...old, { from, text, time: formatTime(eraNow()) }]);
  }

  function playSound() {
    new Audio("/assets/icq-message.wav").play().catch(() => {});
  }

  /* Erik types his messages one by one, then you can reply */
  function friendSays(texts: string[], whenFinished: () => void) {
    texts.forEach((text, i) => {
      const id = window.setTimeout(
        () => {
          addLine(FRIEND, text);
          playSound();
          if (i === texts.length - 1) whenFinished();
        },
        TYPE_TIME * (i + 1),
      );
      timers.current.push(id);
    });
  }

  function startStep(index: number) {
    const current = STEPS[index];
    setStep(index);
    friendSays(current.says, () => {
      if (current.replies.length > 0) setCanReply(true);
      else setDone(true);
    });
  }

  // start the chat when the screen opens
  useEffect(() => {
    startStep(0);
    return () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the clock in the title bar ticking
  useEffect(() => {
    const clock = window.setInterval(() => setNow(eraNow()), 1000);
    return () => clearInterval(clock);
  }, []);

  // keyboard clacking while Erik is typing
  useEffect(() => {
    if (!typingSound.current) {
      const audio = new Audio("/assets/typing.mp3");
      audio.loop = true;
      audio.volume = 0.4;
      typingSound.current = audio;
    }
    const isTyping = !canReply && !done;
    if (isTyping) typingSound.current.play().catch(() => {});
    else typingSound.current.pause();
  }, [canReply, done]);

  // stop the typing sound when leaving the chat
  useEffect(() => {
    return () => typingSound.current?.pause();
  }, []);

  // always scroll to the newest message
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines]);

  function reply(text: string, answer: string) {
    setCanReply(false);
    addLine(YOU, text);
    friendSays([answer], () => startStep(step + 1));
  }

  return (
    <div className="c-desktop">
      <div
        className="c-window"
        role="dialog"
        aria-label={`Chat with ${FRIEND}`}
      >
        {/* title bar: today's date and time, but in 1997 */}
        <div className="w-titlebar c-titlebar">
          {formatDate(now)} &nbsp;{formatTime(now)}
        </div>

        <div className="c-user">
          <strong>{FRIEND}</strong>
          <span className="c-online">● Online</span>
        </div>

        <div className="c-messages" ref={listRef} aria-live="polite">
          {lines.map((line, i) => (
            <p key={i} className="c-line">
              <span className="c-time">[{line.time}]</span>{" "}
              <span className={line.from === YOU ? "c-you" : "c-friend"}>
                {line.from}:
              </span>{" "}
              {line.text}
            </p>
          ))}
          {!canReply && !done && (
            <p className="c-typing">{FRIEND} is typing...</p>
          )}
        </div>

        <div className="c-replies">
          {/* small skip button, for people who don't want to chat */}
          {!done && (
            <button
              type="button"
              className="c-skip"
              onClick={() => goTo("google")}
            >
              Skip &gt;&gt;
            </button>
          )}

          {canReply &&
            STEPS[step].replies.map((r) => (
              <button
                key={r.text}
                type="button"
                className="w-btn c-reply"
                onClick={() => reply(r.text, r.answer)}
              >
                {r.text}
              </button>
            ))}

          {done && (
            <button
              type="button"
              className="w-btn w-default c-reply"
              onClick={() => goTo("google")}
            >
              Open Google &gt;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
