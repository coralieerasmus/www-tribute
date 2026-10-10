"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandImage from "@/components/BrandImage";
import { CALLER, ROUTES, SOUNDS, TIMINGS, BRAND } from "@/lib/experience";
import { startRingtone } from "@/lib/sounds";
import styles from "./zoomInvite.module.css";

/**
 * The incoming Zoom call popup. Join and Decline both lead to the call,
 * Decline (or the X) just mocks you first.
 */
export default function ZoomInvite() {
  const router = useRouter();
  const [declined, setDeclined] = useState(false);
  const stopRing = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRing.current = startRingtone(SOUNDS.ring);
    router.prefetch(ROUTES.call);
    return () => stopRing.current?.();
  }, [router]);

  const join = () => {
    stopRing.current?.();
    router.push(ROUTES.call);
  };

  const decline = () => {
    if (declined) return;
    setDeclined(true);
    setTimeout(() => {
      stopRing.current?.();
      router.push(ROUTES.call);
    }, TIMINGS.declineJokeMs);
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Incoming meeting invite">
      <div className={`${styles.card} ${declined ? styles.cardShake : ""}`}>
        <div className={styles.titleBar}>
          <span className={styles.titleIcon}>
            <BrandImage src={BRAND.zoomLogo} alt="" className={styles.titleIconImg} />
          </span>
          <span className={styles.titleText}>Zoom Workplace</span>
          <button className={styles.close} onClick={decline} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.avatar}>
            <span>{CALLER.name.charAt(0)}</span>
            <span className={styles.pulse} />
          </div>
          <div className={styles.name}>{CALLER.name}</div>
          <div className={styles.sub}>is inviting you to a meeting</div>
          <div className={styles.room}>{CALLER.roomName}</div>

          <div className={styles.buttons}>
            <button className={styles.join} onClick={join} disabled={declined}>
              Join
            </button>
            <button className={styles.decline} onClick={decline} disabled={declined}>
              Decline
            </button>
          </div>
          <div className={`${styles.joke} ${declined ? styles.jokeShow : ""}`} aria-live="polite">
            {declined ? "haha u thought" : " "}
          </div>
        </div>
      </div>
    </div>
  );
}
