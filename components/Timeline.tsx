"use client";

import { useEffect, useRef, useState } from "react";
import { ERAS, type EraId } from "@/lib/experience";
import styles from "./timeline.module.css";

/**
 * Always-visible timeline bar.
 * - Shows every era of the journey; past ones are filled, the current one glows.
 * - On arrival it "time travels": the marker slides from the previous era and
 *   the year counts up (2012 → 2020), so every page transition reads as a jump in time.
 *
 * Pages can change the era or hide the bar mid-page with `setTimelineEra()` /
 * `setTimelineVisible()` (used by the brainrot finale).
 */

/** The bar is switched off for now. Set this to true to bring it back. */
const SHOW_TIMELINE = false;

const STORAGE_KEY = "tribute-era";
const ERA_EVENT = "tribute:era";
const VIS_EVENT = "tribute:timeline-visible";

export function setTimelineEra(id: EraId) {
  window.dispatchEvent(new CustomEvent<EraId>(ERA_EVENT, { detail: id }));
}
export function setTimelineVisible(visible: boolean) {
  window.dispatchEvent(new CustomEvent<boolean>(VIS_EVENT, { detail: visible }));
}

const indexOf = (id: string | null) => ERAS.findIndex((e) => e.id === id);

export default function Timeline({
  era: initialEra,
  placement = "bottom",
  offset = 18,
}: {
  era: EraId;
  placement?: "top" | "bottom";
  /** distance from the top/bottom edge in px */
  offset?: number;
}) {
  const [era, setEra] = useState<EraId>(initialEra);
  const [from, setFrom] = useState<number>(-1); // index we travel from (-1 = none)
  const [pos, setPos] = useState<number>(indexOf(initialEra));
  const [traveling, setTraveling] = useState(false);
  const [visible, setVisible] = useState(true);
  const yearRef = useRef<HTMLSpanElement>(null);
  const travelId = useRef(0);

  const current = indexOf(era);

  /* start a time-travel animation from `fromIdx` to `toIdx` */
  const travel = (fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx === toIdx) {
      setPos(toIdx);
      return;
    }
    setFrom(fromIdx);
    setPos(fromIdx);
    setTraveling(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setPos(toIdx)));

    const a = parseInt(ERAS[fromIdx].year, 10);
    const b = parseInt(ERAS[toIdx].year, 10);
    const target = ERAS[toIdx].year;
    const start = performance.now();
    const dur = 1500;
    const id = ++travelId.current; // a newer trip cancels this one
    const tick = (now: number) => {
      if (id !== travelId.current) return;
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      if (yearRef.current) {
        if (!isNaN(a) && !isNaN(b)) yearRef.current.textContent = String(Math.round(a + (b - a) * e));
        else yearRef.current.textContent = target; // e.g. "Now"
        if (k >= 1) yearRef.current.textContent = target;
      }
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => {
      if (id === travelId.current) setTraveling(false);
    }, 3200);
  };

  /* on arrival: travel from the era of the previous page */
  useEffect(() => {
    let prev: string | null = null;
    try {
      prev = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.setItem(STORAGE_KEY, initialEra);
    } catch {
      /* ignore */
    }
    travel(indexOf(prev), indexOf(initialEra));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEra]);

  /* mid-page changes (e.g. iPhone store → "Now") */
  useEffect(() => {
    const onEra = (e: Event) => {
      const id = (e as CustomEvent<EraId>).detail;
      setEra((old) => {
        if (old !== id) {
          travel(indexOf(old), indexOf(id));
          try {
            sessionStorage.setItem(STORAGE_KEY, id);
          } catch {
            /* ignore */
          }
        }
        return id;
      });
    };
    const onVis = (e: Event) => setVisible((e as CustomEvent<boolean>).detail);
    window.addEventListener(ERA_EVENT, onEra);
    window.addEventListener(VIS_EVENT, onVis);
    return () => {
      window.removeEventListener(ERA_EVENT, onEra);
      window.removeEventListener(VIS_EVENT, onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SHOW_TIMELINE) return null;

  const pct = (i: number) => (ERAS.length > 1 ? (i / (ERAS.length - 1)) * 100 : 0);

  return (
    <div
      className={`${styles.wrap} ${traveling ? styles.traveling : ""} ${visible ? "" : styles.hidden}`}
      style={placement === "top" ? { top: offset } : { bottom: offset }}
      aria-label={`Timeline: ${ERAS[current]?.year} ${ERAS[current]?.label}`}
    >
      <div className={styles.caption}>
        {from >= 0 && traveling ? (
          <>
            {ERAS[from].year} <span className={styles.arrow}>→</span> <span ref={yearRef}>{ERAS[from].year}</span>
          </>
        ) : (
          <span ref={yearRef}>{ERAS[current]?.year}</span>
        )}
      </div>
      <div className={styles.track}>
        <div className={styles.line} />
        <div className={styles.lineFill} style={{ width: `${pct(pos)}%` }} />
        {ERAS.map((e, i) => (
          <div
            key={e.id}
            className={`${styles.stop} ${i < pos ? styles.past : ""} ${i === current ? styles.current : ""}`}
            style={{ left: `${pct(i)}%` }}
          >
            <span className={styles.dot} />
            <span className={styles.year}>{e.year}</span>
            <span className={styles.label}>{e.label}</span>
          </div>
        ))}
        <div className={styles.marker} style={{ left: `${pct(pos)}%` }} />
      </div>
    </div>
  );
}