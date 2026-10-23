"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SOUNDS, TIMINGS } from "@/lib/experience";
import { startBuzz } from "@/lib/sounds";
import { setTimelineEra, setTimelineVisible } from "@/components/Timeline";
import { FeedCycle, FeedStrip, LockScreen, PhoneFrame } from "./Phone";
import ScreenBreak from "./ScreenBreak";
import styles from "./finale.module.css";

/**
 * The ending:
 *  1. fade  – the store disappears, only the phone is left (it glides to the centre)
 *  2. solo  – the phone unlocks and swipes through brainrot + politics
 *  3. zoom  – the camera pulls back: the phone becomes one screen in an endless wall of screens
 *  4. break – the display breaks / glitches, then back to the landing page
 */

type Stage = "fade" | "solo" | "zoom" | "break";

export default function BrainrotFinale({
  from,
  frame,
  wallpaper,
  onDone,
}: {
  /** where the store's phone was on screen, so the finale phone starts exactly there */
  from: DOMRect | null;
  frame: string;
  wallpaper: string;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<Stage>("fade");
  const [arrived, setArrived] = useState(false);
  const [tilesMounted, setTilesMounted] = useState(false);
  const [wallGone, setWallGone] = useState(false);
  const [view] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  /* sizes */
  const pw = Math.min(320, (view.h * 0.78) / 2.067); // big phone width
  const tileW = Math.max(76, Math.min(118, view.w / 13)); // one screen in the wall
  const gap = Math.round(tileW * 0.18);
  const shrink = tileW / pw; // big phone → tile
  const outlook = 0.8; // extra pull-back at the end

  /* the wall of screens (centre cell is the phone itself) */
  const tiles = useMemo(() => {
    const stepX = tileW + gap;
    const stepY = tileW * 2.067 + gap;
    // just enough tiles to fill the screen at the end
    const C = Math.ceil((view.w / 2 + tileW) / (stepX * outlook));
    const R = Math.ceil((view.h / 2 + tileW * 2) / (stepY * outlook));
    const out: { x: number; y: number; offset: number; speed: number; delay: number; fade: number }[] = [];
    let n = 0;
    for (let r = -R; r <= R; r++) {
      for (let c = -C; c <= C; c++) {
        if (r === 0 && c === 0) continue;
        n++;
        out.push({
          x: c * stepX,
          y: r * stepY,
          offset: (n * 7) % 18,
          speed: 0.6 + ((n * 37) % 10) / 10,
          delay: ((n * 53) % 60) / 10,
          fade: Math.hypot(c, r * 2),
        });
      }
    }
    return out;
  }, [view, tileW, gap]);

  /* stage timeline */
  useEffect(() => {
    setTimelineEra("feed");
    const t: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => t.push(setTimeout(fn, ms));
    requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)));
    const solo = TIMINGS.finaleFadeMs;
    const zoom = solo + TIMINGS.finaleSoloMs;
    const brk = zoom + TIMINGS.finaleZoomMs;
    at(solo, () => setStage("solo"));
    at(zoom - 400, () => setTilesMounted(true)); // mount the wall just before the camera pulls back
    at(zoom, () => setStage("zoom"));
    at(brk, () => {
      setStage("break");
      setTimelineVisible(false);
    });
    // the cracks cover the wall almost instantly; dropping it keeps the glitch smooth
    at(brk + 250, () => setWallGone(true));
    return () => t.forEach(clearTimeout);
  }, []);

  /* sound: optional brainrot loop + a rising hum while the wall appears */
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    let stopBuzz: (() => void) | null = null;
    if (stage === "solo" || stage === "zoom") {
      audio = new Audio(SOUNDS.brainrot);
      audio.loop = true;
      audio.volume = stage === "zoom" ? 0.9 : 0.6;
      void audio.play().catch(() => {});
    }
    if (stage === "zoom") stopBuzz = startBuzz(0.05);
    return () => {
      audio?.pause();
      stopBuzz?.();
    };
  }, [stage]);

  /* phone transform */
  const fromStyle = (() => {
    if (!from) return "translate(0px, 0px) scale(1)";
    const dx = from.left + from.width / 2 - view.w / 2;
    const dy = from.top + from.height / 2 - view.h / 2;
    return `translate(${dx}px, ${dy}px) scale(${from.width / pw})`;
  })();
  const phoneTransform = !arrived
    ? fromStyle
    : stage === "zoom" || stage === "break"
      ? `translate(0px, 0px) scale(${shrink * outlook})`
      : "translate(0px, 0px) scale(1)";
  const phoneTransition =
    stage === "zoom" || stage === "break"
      ? `transform ${TIMINGS.finaleZoomMs}ms cubic-bezier(0.7, 0, 0.3, 1)`
      : `transform ${TIMINGS.finaleFadeMs}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;

  const wallStyle: CSSProperties = {
    transform: stage === "zoom" || stage === "break" ? `scale(${outlook})` : `scale(${1 / shrink})`,
    transition: `transform ${TIMINGS.finaleZoomMs}ms cubic-bezier(0.7, 0, 0.3, 1)`,
  };

  const showWall = stage === "zoom" || stage === "break";

  return (
    <div className={`${styles.root} ${arrived ? styles.dark : ""}`} style={{ transitionDuration: `${TIMINGS.finaleFadeMs}ms` }} data-stage={stage}>
      {/* the wall of screens */}
      <div className={`${styles.wall} ${stage === "break" ? styles.frozen : ""}`} style={wallStyle}>
        {tilesMounted && !wallGone && tiles.map((t, i) => (
          <div
            key={i}
            className={`${styles.tile} ${showWall ? styles.tileOn : ""}`}
            style={{
              left: t.x - tileW / 2,
              top: t.y - (tileW * 2.067) / 2,
              transitionDelay: `${Math.min(1.6, t.fade * 0.12)}s`,
            }}
          >
            <PhoneFrame lite frame="#1b1b1d" style={{ "--pw": `${tileW}px` } as CSSProperties}>
              <FeedCycle offset={t.offset} secondsPerVideo={t.speed} delay={t.delay} />
            </PhoneFrame>
          </div>
        ))}
      </div>

      {/* the phone */}
      <div
        className={styles.phoneWrap}
        hidden={wallGone}
        style={{
          left: view.w / 2 - pw / 2,
          top: view.h / 2 - (pw * 2.067) / 2,
          transform: phoneTransform,
          transition: phoneTransition,
        }}
      >
        <PhoneFrame frame={frame} style={{ "--pw": `${pw}px` } as CSSProperties}>
          <LockScreen wallpaper={wallpaper} />
          <div className={`${styles.unlock} ${stage !== "fade" ? styles.unlocked : ""}`}>
            <FeedStrip offset={0} secondsPerVideo={0.9} withVideo />
          </div>
        </PhoneFrame>
      </div>

      {stage === "break" && (
        <ScreenBreak
          origin={[view.w / 2, view.h / 2]}
          durationMs={TIMINGS.screenBreakMs}
          image="/images/broken-screen.jpg"
          onDone={() => doneRef.current()}
        />
      )}
    </div>
  );
}