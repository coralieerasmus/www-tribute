"use client";

import type { CSSProperties, ReactNode } from "react";
import { feedStrip, type FeedItem } from "./feed";
import styles from "./phone.module.css";

/**
 * A phone drawn entirely in CSS, so its screen can show live content
 * (lock screen, the brainrot feed, …). Everything inside the screen scales
 * with the phone (container query units), so the same parts work for the big
 * phone in the store and the tiny screens in the finale wall.
 */
export function PhoneFrame({
  frame,
  children,
  className,
  style,
  lite,
}: {
  /** colour of the metal frame */
  frame: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** cheap version (no shadows / buttons) for the hundreds of tiny screens in the finale */
  lite?: boolean;
}) {
  return (
    <div className={`${styles.phone} ${lite ? styles.lite : ""} ${className ?? ""}`} style={{ ...style, "--frame": frame } as CSSProperties}>
      {!lite && (
        <>
          <span className={`${styles.btn} ${styles.btnAction}`} />
          <span className={`${styles.btn} ${styles.btnVolUp}`} />
          <span className={`${styles.btn} ${styles.btnVolDown}`} />
          <span className={`${styles.btn} ${styles.btnPower}`} />
        </>
      )}
      <div className={styles.screen}>
        {children}
        <span className={styles.island} />
      </div>
    </div>
  );
}

export function LockScreen({ wallpaper }: { wallpaper: string }) {
  return (
    <div className={styles.lock} style={{ background: wallpaper }}>
      <div className={styles.lockDate}>Friday 23 October</div>
      <div className={styles.lockTime}>9:41</div>
      <div className={styles.lockBottom}>
        <span className={styles.lockIcon}>🔦</span>
        <span className={styles.lockHandle} />
        <span className={styles.lockIcon}>📷</span>
      </div>
    </div>
  );
}

/** One short-form video: a real clip, a still from it, or a drawn fake. */
export function FeedCard({ item, withVideo, still = 0 }: { item: FeedItem; withVideo?: boolean; still?: number }) {
  return (
    <div className={`${styles.card} ${item.kind === "politics" ? styles.cardNews : ""}`} style={{ background: item.bg }}>
      {withVideo && item.video ? (
        <video className={styles.cardVideo} src={item.video} autoPlay muted loop playsInline preload="auto" />
      ) : item.stills?.length ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.cardVideo} src={item.stills[still % item.stills.length]} alt="" loading="lazy" decoding="async" />
      ) : (
        <div className={styles.cardEmoji}>{item.emoji}</div>
      )}
      {item.overlay && <div className={styles.cardOverlay}>{item.overlay}</div>}
      {item.kind === "politics" && (
        <div className={styles.ticker}>
          <span>LIVE</span>
          <em>{item.caption} · {item.caption} · </em>
        </div>
      )}
      <div className={styles.cardSide}>
        <span>❤️<small>{item.likes}</small></span>
        <span>💬<small>{Math.max(1, Math.round(parseFloat(item.likes) * 7))}K</small></span>
        <span>↗️<small>Share</small></span>
      </div>
      <div className={styles.cardInfo}>
        <b>{item.user}</b>
        <span>{item.caption}</span>
      </div>
      <div className={styles.cardProgress}>
        <i />
      </div>
    </div>
  );
}

/**
 * Cheap version for the wall of screens: three videos that flick between each
 * other (no tall swiping strip, so hundreds of them stay smooth).
 */
export function FeedCycle({ offset, secondsPerVideo = 1, delay = 0 }: { offset: number; secondsPerVideo?: number; delay?: number }) {
  const items = feedStrip(offset).slice(0, 3);
  const dur = secondsPerVideo * 3;
  return (
    <div className={styles.feed}>
      {items.map((it, i) => (
        <div
          key={i}
          className={styles.cycleCard}
          style={{ animationDuration: `${dur}s`, animationDelay: `${-delay - (i * dur) / 3}s` }}
        >
          <FeedCard item={it} still={offset + i} />
        </div>
      ))}
    </div>
  );
}

/**
 * An endlessly swiping feed. Pure CSS animation (no timers), so a hundred of
 * them can run at once in the finale wall.
 */
export function FeedStrip({
  offset,
  secondsPerVideo = 1,
  delay = 0,
  withVideo,
}: {
  offset: number;
  secondsPerVideo?: number;
  delay?: number;
  withVideo?: boolean;
}) {
  const items = feedStrip(offset);
  return (
    <div className={styles.feed}>
      <div
        className={styles.strip}
        style={{ animationDuration: `${secondsPerVideo * 6}s`, animationDelay: `${-delay}s` }}
      >
        {[...items, items[0]].map((it, i) => (
          <FeedCard key={i} item={it} withVideo={withVideo} />
        ))}
      </div>
    </div>
  );
}