"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { playShatter, startBuzz } from "@/lib/sounds";
import styles from "./screenBreak.module.css";

/**
 * Full-screen "your display just broke" simulation.
 *  0.0s  impact: flash, cracks shoot out from the impact point, glass sound
 *  0.2s  sectors between the cracks start bleeding LCD stripes / dead colours
 *  2.6s  black ink spreads out from the impact
 *  ~end  everything dies to black, then `onDone()` is called
 */

type Pt = [number, number];
type Sector = { clip: string; style: CSSProperties; kind: string; delay: number; flicker: number };
type Geometry = {
  W: number;
  H: number;
  impact: Pt;
  cracks: string[];
  rings: string[];
  sectors: Sector[];
  deadLines: { top: number; color: string; delay: number }[];
};

const PALETTE = ["#ff1a1a", "#00ff55", "#1f3dff", "#ff00e6", "#00f0ff", "#ffffff", "#7a1cff", "#ff8a00", "#000", "#000", "#000"];

function stripes(rand: () => number, dir = "90deg") {
  const stops: string[] = [];
  let x = 0;
  while (x < 100) {
    const w = 0.35 + rand() * (rand() < 0.15 ? 2.4 : 0.9);
    const c = PALETTE[Math.floor(rand() * PALETTE.length)];
    stops.push(`${c} ${x.toFixed(2)}%`, `${c} ${Math.min(100, x + w).toFixed(2)}%`);
    x += w;
  }
  return `linear-gradient(${dir}, ${stops.join(", ")})`;
}

function generate(origin: Pt | null): Geometry {
  const rand = Math.random;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const impact: Pt = origin ?? [W * (0.4 + rand() * 0.2), H * (0.3 + rand() * 0.25)];
  const R = Math.hypot(W, H) * 1.2;

  // radial cracks
  const n = 16 + Math.floor(rand() * 8);
  const angles = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 + (rand() - 0.5) * ((Math.PI * 2) / n) * 0.8).sort((a, b) => a - b);

  const cracks: string[] = [];
  const rayPts: Pt[][] = [];
  for (const a0 of angles) {
    const pts: Pt[] = [impact];
    let [x, y] = impact;
    let a = a0;
    let dist = 0;
    while (dist < R) {
      const step = 25 + rand() * 110;
      a += (rand() - 0.5) * 0.28;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      dist += step;
      pts.push([x, y]);
      // branches
      if (rand() < 0.22 && dist > 60) {
        const ba = a + (rand() < 0.5 ? -1 : 1) * (0.35 + rand() * 0.6);
        const bl = 40 + rand() * 260;
        let bx = x;
        let by = y;
        const bp: Pt[] = [[x, y]];
        for (let s = 0; s < 3; s++) {
          bx += Math.cos(ba + (rand() - 0.5) * 0.4) * (bl / 3);
          by += Math.sin(ba + (rand() - 0.5) * 0.4) * (bl / 3);
          bp.push([bx, by]);
        }
        cracks.push("M" + bp.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L"));
      }
    }
    rayPts.push(pts);
    cracks.unshift("M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L"));
  }

  // concentric rings near the impact
  const rings: string[] = [];
  for (const r0 of [18 + rand() * 18, 55 + rand() * 50, 130 + rand() * 120]) {
    let d = "";
    angles.forEach((a, i) => {
      if (rand() < 0.28) return;
      const a2 = angles[(i + 1) % n] + (i === n - 1 ? Math.PI * 2 : 0);
      const r1 = r0 * (0.85 + rand() * 0.3);
      const r2 = r0 * (0.85 + rand() * 0.3);
      d += `M${(impact[0] + Math.cos(a) * r1).toFixed(1)} ${(impact[1] + Math.sin(a) * r1).toFixed(1)} L${(impact[0] + Math.cos(a2) * r2).toFixed(1)} ${(impact[1] + Math.sin(a2) * r2).toFixed(1)} `;
    });
    if (d) rings.push(d);
  }

  // sectors between neighbouring cracks
  const kinds = ["stripes", "stripes", "stripes", "black", "black", "red", "photo", "photo", "grid", "clear"];
  const sectors: Sector[] = angles.map((a, i) => {
    const a2 = angles[(i + 1) % n] + (i === n - 1 ? Math.PI * 2 : 0);
    const mid = (a + a2) / 2;
    const p = (ang: number): Pt => [impact[0] + Math.cos(ang) * R, impact[1] + Math.sin(ang) * R];
    const poly = [impact, p(a), p(mid), p(a2)].map(([x, y]) => `${x.toFixed(0)}px ${y.toFixed(0)}px`).join(", ");
    const kind = kinds[Math.floor(rand() * kinds.length)];
    let style: CSSProperties = {};
    if (kind === "stripes") style = { background: stripes(rand) };
    if (kind === "black") style = { background: "#000" };
    if (kind === "red")
      style = {
        background:
          "linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px) 0 0/7px 100%, repeating-linear-gradient(0deg, #ff1e1e 0 3px, #ff8080 3px 4px, #c40000 4px 7px, #ff3b3b 7px 9px)",
      };
    if (kind === "grid")
      style = {
        background: `repeating-linear-gradient(0deg, rgba(0,0,0,.55) 0 2px, transparent 2px 6px), ${stripes(rand)}`,
      };
    if (kind === "photo") style = {};
    return { clip: `polygon(${poly})`, style, kind, delay: 0.12 + rand() * 1.6, flicker: 0.08 + rand() * 0.5 };
  });

  const deadLines = Array.from({ length: 7 }, () => ({
    top: rand() * 100,
    color: PALETTE[Math.floor(rand() * 6)],
    delay: rand() * 2.5,
  }));

  return { W, H, impact, cracks, rings, sectors, deadLines };
}

export default function ScreenBreak({
  origin,
  durationMs,
  image,
  onDone,
}: {
  origin: Pt | null;
  durationMs: number;
  /** reference photo of a broken screen, blended into some sectors */
  image?: string;
  onDone: () => void;
}) {
  const [geo] = useState<Geometry>(() => generate(origin));
  const [ink, setInk] = useState(false);
  const [dying, setDying] = useState(false);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    playShatter();
    let stopBuzz: (() => void) | null = null;
    const t1 = setTimeout(() => (stopBuzz = startBuzz(0.14)), 250);
    const t2 = setTimeout(() => setDying(true), durationMs - 900);
    const t3 = setTimeout(() => stopBuzz?.(), durationMs - 350);
    const t4 = setTimeout(() => doneRef.current(), durationMs);

    // black ink spreading from the impact point (GPU-friendly: scaled circles, no repaints)
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setInk(true)));

    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
      cancelAnimationFrame(raf);
      stopBuzz?.();
    };
  }, [durationMs, geo]);

  return (
    <div className={styles.root} aria-hidden="true">
      {/* LCD bleed in the sectors */}
      {geo.sectors.map((s, i) =>
        s.kind === "clear" ? null : (
          <div
            key={i}
            className={`${styles.sector} ${s.kind === "stripes" || s.kind === "grid" ? styles.sectorJitter : ""}`}
            style={
              {
                clipPath: s.clip,
                animationDelay: `${s.delay}s, ${s.delay + 0.4}s`,
                "--flicker": `${s.flicker}s`,
                ...(s.kind === "photo"
                  ? { backgroundImage: image ? `url(${image})` : stripes(Math.random), backgroundSize: "cover", backgroundPosition: "center" }
                  : {}),
                ...s.style,
              } as CSSProperties
            }
          />
        ),
      )}

      {/* black ink: three blobs growing from the impact */}
      {[
        [0, 0, 1],
        [160, 90, 0.8],
        [-220, 40, 0.72],
      ].map(([dx, dy, k], i) => {
        const R = Math.hypot(geo.W, geo.H) * k;
        return (
          <div
            key={`ink${i}`}
            className={styles.inkBlob}
            style={{
              left: geo.impact[0] + dx - R,
              top: geo.impact[1] + dy - R,
              width: R * 2,
              height: R * 2,
              transform: ink ? "scale(1)" : "scale(0)",
              transitionDuration: `${durationMs * 0.53}ms`,
              transitionDelay: `${durationMs * 0.37}ms`,
            }}
          />
        );
      })}

      {/* dead pixel rows */}
      {geo.deadLines.map((l, i) => (
        <div key={i} className={styles.deadLine} style={{ top: `${l.top}%`, background: l.color, animationDelay: `${l.delay}s` }} />
      ))}

      {/* cracks */}
      <svg className={styles.cracks} width={geo.W} height={geo.H} viewBox={`0 0 ${geo.W} ${geo.H}`}>
        <defs>
          <radialGradient id="sbImpact">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.4" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {geo.cracks.map((d, i) => (
          <g key={i}>
            <path d={d} pathLength={1} className={styles.crackShadow} style={{ animationDelay: `${i * 0.006}s` }} />
            <path d={d} pathLength={1} className={styles.crack} style={{ animationDelay: `${i * 0.006}s` }} />
          </g>
        ))}
        {geo.rings.map((d, i) => (
          <path key={`r${i}`} d={d} className={styles.ring} style={{ animationDelay: `${0.05 + i * 0.05}s` }} />
        ))}
        <circle cx={geo.impact[0]} cy={geo.impact[1]} r={46} fill="url(#sbImpact)" className={styles.impact} />
      </svg>

      <div className={styles.flash} />
      <div className={`${styles.death} ${dying ? styles.deathOn : ""}`} />
    </div>
  );
}