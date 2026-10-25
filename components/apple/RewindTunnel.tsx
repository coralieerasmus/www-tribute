"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ERAS, type EraId } from "@/lib/experience";
import { startRewind } from "@/lib/sounds";
import { setTimelineEra, setTimelineVisible } from "@/components/Timeline";
import { VIDEOS, thumbnailFor } from "@/components/youtube/videos";
import styles from "./rewind.module.css";

/** still frames of the brainrot clips (public/feed/stills/clip1-1.jpg … clip7-4.jpg) */
const ALL_STILLS: string[] = Array.from({ length: 7 }, (_, c) =>
  Array.from({ length: 4 }, (_, i) => `/feed/stills/clip${c + 1}-${i + 1}.jpg`),
).flat();

/**
 * Rewinding back in time: the camera flies down a corridor of screens.
 * The screens get older the further you go:
 *   2026 phones with brainrot → 2025 search/AI pages → 2020 video-call grids → 2012 YouTube on CRTs
 * Years are painted on the floor, the timeline bar travels back with you,
 * and at the end of the corridor there's the light of the very first page.
 */

type Era = "now" | "web" | "call" | "old";
type Screen = { x: number; y: number; z: number; rot: number; era: Era; img?: string; seed: number };

const HALF_WIDTH = 560; // corridor half width (px)
const LENGTH = 9000; // corridor length (px)
const SPACING = 300;
const ROWS = [-250, -10, 230];

/** where each era starts along the corridor (0 = here, 1 = the end) */
const STOPS: { at: number; era: Era; timeline: EraId; year: string }[] = [
  { at: 0, era: "now", timeline: "apple", year: "2026" },
  { at: 0.27, era: "web", timeline: "google", year: "2025" },
  { at: 0.5, era: "call", timeline: "call", year: "2020" },
  { at: 0.73, era: "old", timeline: "youtube", year: "2012" },
];
const eraAt = (f: number) => [...STOPS].reverse().find((s) => f >= s.at)!;

/* the camera's easing (same as the CSS transition below) */
const EASE = "cubic-bezier(0.55, 0, 0.35, 1)";
function bezierY(t: number) {
  // cubic-bezier(0.55, 0, 0.35, 1): solve x(s)=t, return y(s)
  const x1 = 0.55,
    y1 = 0,
    x2 = 0.35,
    y2 = 1;
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

export default function RewindTunnel({ durationMs, onDone }: { durationMs: number; onDone: () => void }) {
  const [go, setGo] = useState(false);
  const [year, setYear] = useState(STOPS[0].year);
  const [flash, setFlash] = useState(false);
  const flyMs = durationMs - 700;

  const screens = useMemo<Screen[]>(() => {
    const out: Screen[] = [];
    const ytThumbs = VIDEOS.map(thumbnailFor).filter(Boolean);
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
            img: era === "now" ? ALL_STILLS[n % ALL_STILLS.length] : era === "old" ? ytThumbs[n % ytThumbs.length] : undefined,
          });
        }
      }
    }
    return out;
  }, []);

  useEffect(() => {
    setTimelineVisible(true);
    setTimelineEra(STOPS[0].timeline);
    const stopSound = startRewind(durationMs);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setGo(true)));
    STOPS.slice(1).forEach((s) => {
      timers.push(
        setTimeout(() => {
          setYear(s.year);
          setTimelineEra(s.timeline);
        }, timeForDepth(Math.min(1, s.at + 0.08)) * flyMs),
      );
    });
    timers.push(setTimeout(() => setFlash(true), flyMs - 150));
    timers.push(setTimeout(onDone, durationMs));
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      stopSound();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const worldStyle: CSSProperties = {
    transform: `translateZ(${go ? LENGTH + 250 : 0}px)`,
    transition: `transform ${flyMs}ms ${EASE}`,
  };

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
            {Array.from({ length: Math.floor(LENGTH / 420) }).map((_, i) => (
              <div key={i} className={styles.floorMark} style={{ top: i * 420 + 120 }}>
                ◀◀ REWIND
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

      {/* VHS overlay */}
      <div className={styles.vhs}>
        <div className={styles.rew}>◀◀ REW</div>
        <div className={styles.year} key={year}>
          {year}
        </div>
        <div className={styles.tracking} />
        <div className={styles.scanlines} />
      </div>
      <div className={`${styles.flash} ${flash ? styles.flashOn : ""}`} />
    </div>
  );
}

const NAMES = ["Sam", "Noor", "Jenni", "Daan", "Lisa", "Milan", "Emma", "Yara"];
const ERA_LABEL = Object.fromEntries(ERAS.map((e) => [e.id, e.year]));

function ScreenContent({ s }: { s: Screen }) {
  if (s.era === "now" && s.img) return <img src={s.img} alt="" decoding="async" />;
  if (s.era === "old" && s.img) return <img src={s.img} alt="" decoding="async" />;
  if (s.era === "web")
    return (
      <div className={styles.web}>
        <div className={styles.webBar} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.webRow}>
            <i style={{ width: `${40 + ((s.seed * (i + 3)) % 45)}%` }} />
            <b style={{ width: `${70 + ((s.seed * (i + 7)) % 25)}%` }} />
          </div>
        ))}
      </div>
    );
  return (
    <div className={styles.grid} data-year={ERA_LABEL.call}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ background: `hsl(${(s.seed * 47 + i * 70) % 360} 25% 32%)` }}>
          <span>{NAMES[(s.seed + i) % NAMES.length]}</span>
        </div>
      ))}
    </div>
  );
}