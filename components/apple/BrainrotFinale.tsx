"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { TIMINGS } from "@/lib/experience";
import { playPowerOff, startCrowd, type Crowd } from "@/lib/sounds";
import { setTimelineEra, setTimelineVisible } from "@/components/Timeline";
import { CLIPS } from "./feed";
import { FeedCycle, FeedStrip, LockScreen, PhoneFrame } from "./Phone";
import { ZOOM_EASE_CSS, finaleLayout } from "./finaleLayout";
import RewindTunnel from "./RewindTunnel";
import ScreenGlitch from "./ScreenGlitch";
import styles from "./finale.module.css";

/**
 * The ending:
 *  1. fade   – the store disappears, only the phone is left (it glides to the centre)
 *  2. solo   – the phone plays your brainrot clips
 *  3. zoom   – the camera pulls back: the phone becomes one screen in an endless wall of screens
 *  4. wall   – you look at the wall while the camera slowly keeps drifting back;
 *              the sound of every video joins in, one by one, until it's a wall of noise
 *  5. glitch – the signal breaks down and the screen switches off
 *  6. rewind – a flight back through a corridor of screens: 2026 → 2020 → 2012 → 2005 → the 90s
 *
 * With `use3D` the phone itself is the three.js model (PhoneScene, driven by the
 * parent through `onStage`). Without it, a CSS phone is used.
 */

export type FinaleStage = "fade" | "solo" | "zoom" | "wall" | "glitch" | "rewind";

/** how long the "switching off" at the end of the glitch takes */
const OFF_MS = 650;

export default function BrainrotFinale({
  from,
  frame,
  wallpaper,
  use3D,
  onStage,
  onDone,
}: {
  /** where the store's phone was on screen (CSS phone starts there) */
  from: DOMRect | null;
  frame: string;
  wallpaper: string;
  use3D: boolean;
  onStage?: (s: FinaleStage) => void;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<FinaleStage>("fade");
  const [arrived, setArrived] = useState(false);
  const [tilesMounted, setTilesMounted] = useState(false);
  const [view] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const doneRef = useRef(onDone);
  const stageRef = useRef(onStage);
  const crowd = useRef<Crowd | null>(null);
  useEffect(() => {
    doneRef.current = onDone;
    stageRef.current = onStage;
  }, [onDone, onStage]);

  const L = finaleLayout(view.w, view.h);
  const endScale = L.outlook * L.drift; // how far the camera is pulled back at the very end

  /* the wall of screens (centre cell is the phone itself) */
  const tiles = useMemo(() => {
    const stepX = L.tileW + L.gap;
    const stepY = L.tileH + L.gap;
    const C = Math.ceil((view.w / 2 + L.tileW) / (stepX * endScale));
    const R = Math.ceil((view.h / 2 + L.tileH) / (stepY * endScale));
    const out: { x: number; y: number; offset: number; speed: number; delay: number; fade: number }[] = [];
    let n = 0;
    for (let r = -R; r <= R; r++) {
      for (let c = -C; c <= C; c++) {
        if (r === 0 && c === 0) continue;
        n++;
        out.push({
          x: c * stepX,
          y: r * stepY,
          offset: (n * 7) % 26,
          speed: 0.5 + ((n * 37) % 10) / 12,
          delay: ((n * 53) % 60) / 10,
          fade: Math.hypot(c, r * 2),
        });
      }
    }
    return out;
  }, [view, L.tileW, L.tileH, L.gap, endScale]);

  /* stage timeline */
  useEffect(() => {
    const go = (s: FinaleStage) => {
      setStage(s);
      stageRef.current?.(s);
    };
    setTimelineEra("feed");
    stageRef.current?.("fade");
    const t: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => t.push(setTimeout(fn, ms));
    requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)));
    const solo = TIMINGS.finaleFadeMs;
    const zoom = solo + TIMINGS.finaleSoloMs;
    const wall = zoom + TIMINGS.finaleZoomMs;
    const glitch = wall + TIMINGS.finaleWallMs;
    const rewind = glitch + TIMINGS.finaleGlitchMs;
    at(solo, () => go("solo"));
    at(zoom - 400, () => setTilesMounted(true)); // mount the wall just before the camera pulls back
    at(zoom, () => {
      go("zoom");
      // every video's sound joins in, one after the other
      crowd.current = startCrowd(
        CLIPS.map((c) => c.video).filter((v): v is string => !!v),
        { volume: 0.2, staggerMs: Math.max(250, (TIMINGS.finaleZoomMs + TIMINGS.finaleWallMs * 0.5) / CLIPS.length) },
      );
    });
    at(wall, () => go("wall"));
    at(glitch, () => {
      go("glitch");
      setTimelineVisible(false);
      crowd.current?.glitch();
    });
    at(rewind - OFF_MS, () => {
      // the screen switches off: silence
      crowd.current?.stop();
      playPowerOff();
      setTilesMounted(false);
    });
    at(rewind, () => go("rewind"));
    return () => {
      t.forEach(clearTimeout);
      crowd.current?.stop();
    };
  }, []);

  /* CSS phone (only without 3D) */
  const fromStyle = (() => {
    if (!from) return "translate(0px, 0px) scale(1)";
    const dx = from.left + from.width / 2 - view.w / 2;
    const dy = from.top + from.height / 2 - view.h / 2;
    return `translate(${dx}px, ${dy}px) scale(${from.width / L.pw})`;
  })();
  const zoomed = stage === "zoom";
  const drifting = stage === "wall" || stage === "glitch";
  const phoneTransform = !arrived
    ? fromStyle
    : drifting
      ? `translate(0px, 0px) scale(${L.shrink * endScale})`
      : zoomed
        ? `translate(0px, 0px) scale(${L.shrink * L.outlook})`
        : "translate(0px, 0px) scale(1)";
  const phoneTransition = drifting
    ? `transform ${TIMINGS.finaleWallMs}ms linear`
    : zoomed
      ? `transform ${TIMINGS.finaleZoomMs}ms ${ZOOM_EASE_CSS}`
      : `transform ${TIMINGS.finaleFadeMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;

  // the wall uses exactly the same moves as the phone, so the phone stays in its slot
  const wallStyle: CSSProperties = drifting
    ? { transform: `scale(${endScale})`, transition: `transform ${TIMINGS.finaleWallMs}ms linear` }
    : zoomed
      ? { transform: `scale(${L.outlook})`, transition: `transform ${TIMINGS.finaleZoomMs}ms ${ZOOM_EASE_CSS}` }
      : { transform: `scale(${1 / L.shrink})` };

  const wallVisible = zoomed || drifting;

  return (
    <>
      <div className={`${styles.root} ${arrived ? styles.dark : ""}`} style={{ transitionDuration: `${TIMINGS.finaleFadeMs}ms` }} data-stage={stage}>
        {/* the wall of screens */}
        <div className={`${styles.wall} ${stage === "glitch" ? styles.glitching : ""}`} style={wallStyle}>
          {tilesMounted &&
            tiles.map((t, i) => (
              <div
                key={i}
                className={`${styles.tile} ${wallVisible ? styles.tileOn : ""}`}
                style={{
                  left: t.x - L.tileW / 2,
                  top: t.y - L.tileH / 2,
                  transitionDelay: `${Math.min(1.4, t.fade * 0.1)}s`,
                }}
              >
                <PhoneFrame lite frame="#1b1b1d" style={{ "--pw": `${L.tileW}px` } as CSSProperties}>
                  <FeedCycle offset={t.offset} secondsPerVideo={t.speed} delay={t.delay} />
                </PhoneFrame>
              </div>
            ))}
        </div>

        {/* the CSS phone (fallback when the 3D phone isn't available) */}
        {!use3D && stage !== "rewind" && (
          <div
            className={styles.phoneWrap}
            style={{
              left: view.w / 2 - L.pw / 2,
              top: view.h / 2 - L.phoneH / 2,
              transform: phoneTransform,
              transition: phoneTransition,
            }}
          >
            <PhoneFrame frame={frame} style={{ "--pw": `${L.pw}px` } as CSSProperties}>
              <LockScreen wallpaper={wallpaper} />
              <div className={`${styles.unlock} ${stage !== "fade" ? styles.unlocked : ""}`}>
                <FeedStrip offset={0} secondsPerVideo={1.8} withVideo />
              </div>
            </PhoneFrame>
          </div>
        )}

        {stage === "rewind" && <RewindTunnel durationMs={TIMINGS.rewindMs} onDone={() => doneRef.current()} />}
      </div>

      {/* outside the root, so it also sits on top of the 3D phone */}
      {stage === "glitch" && <ScreenGlitch durationMs={TIMINGS.finaleGlitchMs} offMs={OFF_MS} />}
    </>
  );
}