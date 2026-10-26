"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { playChime, startTimeTravel } from "@/lib/sounds";
import { VIDEOS, thumbnailFor } from "@/components/youtube/videos";
import styles from "./rewind.module.css";

/**
 * Travelling back in time: the camera glides down a dark corridor of screens.
 * The screens get older the further you go:
 *   2026 phones with the feed → 2020 video calls → 2012 YouTube → 2005 MSN → 1999 the early web → 1995
 * A quiet year counter runs backwards, each era is marked by a soft chime,
 * and at the end of the corridor there's the light of the very first page.
 */

type Era = "now" | "call" | "yt" | "msn" | "web";
type Screen = { x: number; y: number; z: number; rot: number; era: Era; img?: string; seed: number };

const HALF_WIDTH = 560; // corridor half width (px)
const LENGTH = 11000; // corridor length (px)
const SPACING = 300;
const ROWS = [-250, -10, 230];

/** where each era starts along the corridor (0 = here, 1 = the end) */
const STOPS: { at: number; era: Era; year: number; label: string; chime: number }[] = [
  { at: 0, era: "now", year: 2026, label: "The feed", chime: 659.25 },
  { at: 0.2, era: "call", year: 2020, label: "The video call", chime: 587.33 },
  { at: 0.4, era: "yt", year: 2012, label: "YouTube", chime: 523.25 },
  { at: 0.6, era: "msn", year: 2005, label: "Messenger", chime: 440 },
  { at: 0.8, era: "web", year: 1999, label: "The early web", chime: 392 },
];
/** the year shown when you reach the light (where the website starts) */
const FIRST_YEAR = 1995;
const eraAt = (f: number) => [...STOPS].reverse().find((s) => f >= s.at)!;

/* still frames of the brainrot clips (public/feed/stills/clip1-1.jpg … clip7-4.jpg) */
const STILLS: string[] = Array.from({ length: 7 }, (_, c) =>
  Array.from({ length: 4 }, (_, i) => `/feed/stills/clip${c + 1}-${i + 1}.jpg`),
).flat();

/* the camera's easing (same as the CSS transition below) */
const EASE = "cubic-bezier(0.45, 0, 0.3, 1)";
const BEZ = [0.45, 0, 0.3, 1] as const;
function bezierY(t: number) {
  const [x1, y1, x2, y2] = BEZ;
  const bx = (s: number) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const by = (s: number) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < t) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}
/** at which time fraction does the camera reach depth fraction `f`? */
function timeForDepth(f: number) {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (bezierY(mid) < f) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
/** the year that belongs to a depth (holds inside an era, counts between eras) */
function yearAt(f: number) {
  const keys = [...STOPS.map((s) => ({ at: s.at, y: s.year })), { at: 1, y: FIRST_YEAR }];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f <= b.at) {
      const hold = a.at + (b.at - a.at) * 0.55; // stay on this year for a while…
      if (f <= hold) return a.y;
      const k = (f - hold) / (b.at - hold); // …then count down to the next one
      return Math.round(a.y + (b.y - a.y) * k);
    }
  }
  return FIRST_YEAR;
}

export default function RewindTunnel({ durationMs, onDone }: { durationMs: number; onDone: () => void }) {
  const [go, setGo] = useState(false);
  const [stop, setStop] = useState(0);
  const [atLight, setAtLight] = useState(false);
  const [flash, setFlash] = useState(false);
  const yearRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const flyMs = durationMs - 700;
  const travel = LENGTH + 250;

  const screens = useMemo<Screen[]>(() => {
    const out: Screen[] = [];
    const ytThumbs = VIDEOS.map(thumbnailFor).filter(Boolean) as string[];
    let n = 0;
    for (let z = 350; z < LENGTH; z += SPACING) {
      for (const side of [-1, 1]) {
        for (const row of ROWS) {
          n++;
          const f = z / LENGTH;
          const era = eraAt(f).era;
          const jitter = ((n * 97) % 60) - 30;
          out.push({
            x: side * HALF_WIDTH,
            y: row + jitter,
            z: -(z + ((n * 37) % 120)),
            rot: -side * (68 + ((n * 13) % 14)),
            era,
            seed: n,
            img: era === "now" ? STILLS[n % STILLS.length] : era === "yt" ? ytThumbs[n % ytThumbs.length] : undefined,
          });
        }
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const stopSound = startTimeTravel(flyMs);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const raf0 = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    playChime(STOPS[0].chime, 0.08);

    STOPS.slice(1).forEach((s, i) => {
      timers.push(
        setTimeout(() => {
          setStop(i + 1);
          playChime(s.chime, 0.1);
        }, timeForDepth(Math.min(1, s.at + 0.05)) * flyMs),
      );
    });
    timers.push(setTimeout(() => setAtLight(true), timeForDepth(0.95) * flyMs));
    timers.push(setTimeout(() => setFlash(true), flyMs - 250));
    timers.push(setTimeout(onDone, durationMs));

    // year counter + progress line, straight into the DOM (no re-renders)
    const start = performance.now() + 32;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - start) / flyMs));
      const depth = (bezierY(k) * travel) / LENGTH;
      if (yearRef.current) yearRef.current.textContent = String(yearAt(Math.min(1, depth)));
      if (barRef.current) barRef.current.style.transform = `scaleX(${k})`;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      stopSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const worldStyle: CSSProperties = {
    transform: `translateZ(${go ? travel : 0}px)`,
    transition: `transform ${flyMs}ms ${EASE}`,
  };
  const label = atLight ? "Back to the beginning" : STOPS[stop].label;

  return (
    <div className={styles.root}>
      <div className={styles.camera}>
        <div className={styles.world} style={worldStyle}>
          {/* floor with the years */}
          <div className={styles.floor} style={{ width: HALF_WIDTH * 2, height: LENGTH + 800, marginLeft: -HALF_WIDTH }}>
            {STOPS.map((s) => (
              <div key={s.year} className={styles.floorYear} style={{ top: s.at * LENGTH + 260 }}>
                {s.year}
              </div>
            ))}
          </div>

          {/* the screens */}
          {screens.map((s) => (
            <div
              key={s.seed}
              className={`${styles.screen} ${styles[s.era]}`}
              style={{ transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px) rotateY(${s.rot}deg)` }}
            >
              <ScreenContent s={s} />
            </div>
          ))}

          {/* the light at the end: where it all started */}
          <div className={styles.end} style={{ transform: `translate3d(0, 0, ${-(LENGTH + 450)}px)` }}>
            <span>www</span>
          </div>
        </div>
      </div>

      <div className={styles.vignette} />
      <div className={styles.grain} />

      {/* caption, like a museum label */}
      <div className={styles.caption}>
        <span ref={yearRef} className={styles.year}>
          {STOPS[0].year}
        </span>
        <span key={label} className={styles.label}>
          {label}
        </span>
        <span className={styles.progress}>
          <span ref={barRef} />
        </span>
      </div>

      <div className={`${styles.flash} ${flash ? styles.flashOn : ""}`} />
    </div>
  );
}

const NAMES = ["Sam", "Noor", "Jenni", "Daan", "Lisa", "Milan", "Emma", "Yara"];
const BUDDIES = ["~*sweet*~", "xX_skater_Xx", "Lisa ♥", "brb dinner", "Noor (Away)", "Daan", "*~music~*"];

function ScreenContent({ s }: { s: Screen }) {
  if (s.era === "now") return s.img ? <img src={s.img} alt="" decoding="async" /> : null;

  if (s.era === "call")
    return (
      <div className={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: `hsl(${(s.seed * 47 + i * 70) % 360} 18% 26%)` }}>
            <b>{NAMES[(s.seed + i) % NAMES.length][0]}</b>
            <span>{NAMES[(s.seed + i) % NAMES.length]}</span>
          </div>
        ))}
      </div>
    );

  if (s.era === "yt")
    return (
      <div className={styles.ytPage}>
        <div className={styles.ytTop}>
          <i />
          <em />
        </div>
        <div className={styles.ytVideo}>{s.img && <img src={s.img} alt="" decoding="async" />}</div>
        <div className={styles.ytBar}>
          <span style={{ width: `${20 + ((s.seed * 31) % 70)}%` }} />
        </div>
      </div>
    );

  if (s.era === "msn")
    return (
      <div className={styles.xp}>
        <div className={styles.msnWin}>
          <div className={styles.msnTitle}>Messenger</div>
          <div className={styles.msnBody}>
            {[0, 1, 2, 3, 4].map((i) => (
              <p key={i}>
                <i className={(s.seed + i) % 3 === 0 ? styles.away : ""} />
                {BUDDIES[(s.seed + i) % BUDDIES.length]}
              </p>
            ))}
          </div>
        </div>
      </div>
    );

  // the early web: grey browser, Times, blue links, "under construction"
  return (
    <div className={styles.browser}>
      <div className={styles.webChrome} />
      <div className={styles.webPage}>
        <h6>Welcome to my Homepage!</h6>
        <u>Links</u>
        <u>Guestbook</u>
        <u>About me</u>
        <div className={styles.construction}>UNDER CONSTRUCTION</div>
        <small>You are visitor #{String(1000 + ((s.seed * 377) % 9000)).padStart(6, "0")}</small>
      </div>
    </div>
  );
}