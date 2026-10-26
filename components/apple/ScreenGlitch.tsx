"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./screenGlitch.module.css";

/**
 * The signal breaks down (instead of the glass breaking):
 *  - torn horizontal bands with wrong colours flicker over everything
 *  - blocky compression artefacts appear and grow
 *  - static noise rises
 *  - the last `offMs`: the screen switches off like an old monitor
 *    (the picture collapses into a thin white line, then a dot, then black)
 *
 * It sits on top of everything (including the 3D phone). The bands and blocks are
 * blended with "difference", so they invert the live picture underneath instead
 * of covering it: the wall keeps playing while it breaks.
 */

type Band = { top: number; h: number; delay: number; dur: number; shift: number; color: string };
type Block = { x: number; y: number; w: number; h: number; delay: number; dur: number; color: string };

/* colours that are blended over the picture with "difference", which inverts/shifts what's underneath */
const COLORS = ["rgba(0,255,255,.85)", "rgba(255,0,170,.8)", "rgba(255,255,255,.9)", "rgba(0,255,90,.7)", "rgba(255,230,0,.7)", "rgba(80,0,255,.75)"];


function generate(durationMs: number) {
  const r = Math.random;
  const active = durationMs / 1000;
  // more and more bands as it gets worse
  const bands: Band[] = Array.from({ length: 16 }, (_, i) => ({
    top: r() * 100,
    h: 0.6 + r() * (r() < 0.25 ? 14 : 4),
    delay: (i / 16) * active * 0.55 + r() * 0.12,
    dur: 0.12 + r() * 0.35,
    shift: (r() - 0.5) * 60,
    color: COLORS[Math.floor(r() * COLORS.length)],
  }));
  const blocks: Block[] = Array.from({ length: 18 }, (_, i) => ({
    x: r() * 92,
    y: r() * 92,
    w: 4 + r() * 16,
    h: 3 + r() * 10,
    delay: 0.2 + (i / 18) * active * 0.5 + r() * 0.1,
    dur: 0.15 + r() * 0.4,
    color: COLORS[Math.floor(r() * COLORS.length)],
  }));
  return { bands, blocks };
}

export default function ScreenGlitch({ durationMs, offMs = 650 }: { durationMs: number; offMs?: number }) {
  const [geo] = useState(() => generate(durationMs - offMs));
  const [off, setOff] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOff(true), durationMs - offMs);
    return () => clearTimeout(t);
  }, [durationMs, offMs]);

  return (
    <>
      {/* layer 1: blended with "difference", so it inverts/shifts the picture underneath */}
      {!off && (
        <div className={`${styles.root} ${styles.blend}`} aria-hidden="true">
          {/* colour-shifted, torn bands */}
          {geo.bands.map((b, i) => (
            <div
              key={`b${i}`}
              className={styles.band}
              style={
                {
                  top: `${b.top}%`,
                  height: `${b.h}%`,
                  animationDelay: `${b.delay}s`,
                  animationDuration: `${b.dur}s`,
                  "--shift": `${b.shift}px`,
                  background: b.color,
                } as CSSProperties
              }
            />
          ))}

          {/* blocky compression artefacts */}
          {geo.blocks.map((b, i) => (
            <div
              key={`k${i}`}
              className={styles.block}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.w}%`,
                height: `${b.h}%`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.dur}s`,
                background: b.color,
              }}
            />
          ))}

        </div>
      )}

      {/* layer 2: normal overlays */}
      <div className={styles.root} aria-hidden="true" style={{ "--glitch": `${durationMs - offMs}ms`, "--off": `${offMs}ms` } as CSSProperties}>
      {!off && (
        <>
          {/* chromatic scan lines + rolling bar + static */}
          <div className={styles.chroma} />
          <div className={styles.roll} />
          <div className={styles.noise} />
          <div className={styles.dim} />
        </>
      )}

      {/* switching off */}
      {off && (
        <div className={styles.off}>
          <div className={styles.line} />
        </div>
      )}
      </div>
    </>
  );
}