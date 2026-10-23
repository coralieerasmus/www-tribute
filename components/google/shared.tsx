"use client";

import BrandImage from "@/components/BrandImage";
import { BRAND } from "@/lib/experience";
import styles from "./google.module.css";

/** The user has to search for something like "apple iphone" to continue. */
export function isValidQuery(q: string) {
  const s = q.toLowerCase().replace(/\s+/g, " ").trim();
  return s.includes("iphone") || s.includes("i phone") || (s.includes("apple") && s.includes("phone"));
}

export const SUGGESTIONS = [
  "apple iphone",
  "apple iphone 17 pro",
  "apple iphone price",
  "apple iphone air",
  "apple iphone refurbished",
  "apple iphone vs samsung",
  "apple iphone deals eindhoven",
];

export function GoogleLogo({ small }: { small?: boolean }) {
  return (
    <BrandImage
      src={BRAND.googleLogo}
      alt="Google"
      className={small ? styles.logoSmall : styles.logoBig}
      fallback={<span className={small ? styles.logoTextSmall : styles.logoTextBig}>Google</span>}
    />
  );
}

export function SearchIcon({ size = 20, color = "#9aa0a6" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="10" cy="10" r="6.5" fill="none" stroke={color} strokeWidth="2" />
      <path d="M15 15l5.5 5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="#202124" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="#202124" strokeWidth="2" />
    </svg>
  );
}

export function LensIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" fill="none" stroke="#202124" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="#202124" strokeWidth="2" />
      <circle cx="17" cy="17" r="1.4" fill="#202124" />
    </svg>
  );
}

export function AppsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#5f6368" />))}
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="#9aa0a6" strokeWidth="2" />
      <path d="M12 7v5.5l3.5 2" fill="none" stroke="#9aa0a6" strokeWidth="2" />
    </svg>
  );
}

/** Generic phone thumbnail drawn in CSS (no product photos needed). */
export function PhoneThumb({ screen, frame = "#1d1d1f", back }: { screen: string; frame?: string; back?: boolean }) {
  return (
    <div className={styles.phoneThumb} style={{ background: frame }}>
      {back ? (
        <div className={styles.phoneCams}>
          <span />
          <span />
          <span />
        </div>
      ) : (
        <div className={styles.phoneScreen} style={{ background: screen }}>
          <span className={styles.phoneIsland} />
        </div>
      )}
    </div>
  );
}

/** Generic laptop thumbnail drawn in CSS (no product photos needed). */
export function LaptopThumb({ screen, base = "#d9d9de", keyboard }: { screen: string; base?: string; keyboard?: boolean }) {
  if (keyboard) {
    return (
      <div className={styles.thumbKeyboard}>
        <div className={styles.thumbKbScreen} style={{ background: screen }} />
        <div className={styles.thumbKbBase}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.thumbKbRow} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.thumb}>
      <div className={styles.thumbScreen} style={{ background: screen }} />
      <div className={styles.thumbBase} style={{ background: base }} />
    </div>
  );
}