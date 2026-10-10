"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./youtube.module.css";
import type { Video } from "./videos";

/* ------------------------------------------------------------------ */
/* Minimal typings for the YouTube IFrame API                          */
/* ------------------------------------------------------------------ */
type YTPlayerInstance = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoLoadedFraction(): number;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  setPlaybackRate(r: number): void;
  getPlayerState(): number;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayerInstance }) => void;
        onStateChange?: (e: { data: number; target: YTPlayerInstance }) => void;
      };
    },
  ) => YTPlayerInstance;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        if (window.YT) resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return ytPromise;
}

/* ------------------------------------------------------------------ */
/* A tiny adapter so the same controls drive YouTube or a local <video> */
/* ------------------------------------------------------------------ */
type Adapter = {
  play(): void;
  pause(): void;
  seek(t: number): void;
  setVolume(v: number): void;
  setMuted(m: boolean): void;
  setRate(r: number): void;
  time(): number;
  duration(): number;
  buffered(): number;
  destroy(): void;
};

export type PlayerHandle = { pause(): void; play(): void };

const QUALITIES = ["1080p HD", "720p HD", "480p", "360p", "240p", "144p", "Auto"];
const SPEEDS = [0.25, 0.5, 1, 1.5, 2];

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function YTPlayer({
  video,
  onEnded,
  onNext,
  theater,
  onToggleTheater,
  ref,
}: {
  video: Video;
  onEnded: () => void;
  onNext: () => void;
  theater: boolean;
  onToggleTheater: () => void;
  ref?: Ref<PlayerHandle>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  const adapterRef = useRef<Adapter | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quality, setQuality] = useState("360p");
  const [speed, setSpeed] = useState(1);
  const [annotations, setAnnotations] = useState(true);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);

  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  /* ---------- create the underlying player ---------- */
  useEffect(() => {
    let cancelled = false;
    const handleState = (s: "playing" | "paused" | "ended" | "buffering") => {
      if (cancelled) return;
      setBuffering(s === "buffering");
      if (s === "playing") {
        setPlaying(true);
        setStarted(true);
        setEnded(false);
      } else if (s === "paused") setPlaying(false);
      else if (s === "ended") {
        setPlaying(false);
        setEnded(true);
        onEndedRef.current();
      }
    };

    if (video.src) {
      const el = localRef.current;
      if (!el) return;
      const onPlay = () => handleState("playing");
      const onPause = () => handleState("paused");
      const onEnd = () => handleState("ended");
      const onWait = () => handleState("buffering");
      el.addEventListener("playing", onPlay);
      el.addEventListener("pause", onPause);
      el.addEventListener("ended", onEnd);
      el.addEventListener("waiting", onWait);
      adapterRef.current = {
        play: () => void el.play().catch(() => {}),
        pause: () => el.pause(),
        seek: (t) => (el.currentTime = t),
        setVolume: (v) => (el.volume = v / 100),
        setMuted: (m) => (el.muted = m),
        setRate: (r) => (el.playbackRate = r),
        time: () => el.currentTime,
        duration: () => el.duration || 0,
        buffered: () => (el.buffered.length && el.duration ? el.buffered.end(el.buffered.length - 1) / el.duration : 0),
        destroy: () => {
          el.removeEventListener("playing", onPlay);
          el.removeEventListener("pause", onPause);
          el.removeEventListener("ended", onEnd);
          el.removeEventListener("waiting", onWait);
        },
      };
      setReady(true);
      void el.play().catch(() => {});
      return () => {
        cancelled = true;
        adapterRef.current?.destroy();
        adapterRef.current = null;
      };
    }

    if (!video.youtubeId) return;
    let player: YTPlayerInstance | null = null;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return;
      const target = document.createElement("div");
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(target);
      player = new YT.Player(target, {
        videoId: video.youtubeId!,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            const p = e.target;
            adapterRef.current = {
              play: () => p.playVideo(),
              pause: () => p.pauseVideo(),
              seek: (t) => p.seekTo(t, true),
              setVolume: (v) => p.setVolume(v),
              setMuted: (m) => (m ? p.mute() : p.unMute()),
              setRate: (r) => p.setPlaybackRate(r),
              time: () => p.getCurrentTime() || 0,
              duration: () => p.getDuration() || 0,
              buffered: () => p.getVideoLoadedFraction() || 0,
              destroy: () => p.destroy(),
            };
            p.setVolume(80);
            setReady(true);
            p.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === 1) handleState("playing");
            else if (e.data === 2) handleState("paused");
            else if (e.data === 0) handleState("ended");
            else if (e.data === 3) handleState("buffering");
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      adapterRef.current = null;
    };
  }, [video.src, video.youtubeId]);

  /* ---------- poll time ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      const a = adapterRef.current;
      if (!a) return;
      if (!scrubbing) setCurrent(a.time());
      setDuration(a.duration());
      setBuffered(a.buffered());
    }, 250);
    return () => clearInterval(id);
  }, [scrubbing]);

  const play = useCallback(() => adapterRef.current?.play(), []);
  const pause = useCallback(() => adapterRef.current?.pause(), []);

  useImperativeHandle(ref, () => ({ play, pause }), [play, pause]);

  const toggle = useCallback(() => {
    if (ended) {
      adapterRef.current?.seek(0);
      adapterRef.current?.play();
      return;
    }
    if (playing) {
      pause();
      setFlash("pause");
    } else {
      play();
      setFlash("play");
    }
    setTimeout(() => setFlash(null), 500);
  }, [ended, playing, pause, play]);

  const setVol = (v: number) => {
    setVolume(v);
    adapterRef.current?.setVolume(v);
    if (v > 0 && muted) {
      setMuted(false);
      adapterRef.current?.setMuted(false);
    }
  };
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      adapterRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const a = adapterRef.current;
      if (!a) return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") a.seek(Math.min(a.duration(), a.time() + 5));
      else if (e.key === "ArrowLeft") a.seek(Math.max(0, a.time() - 5));
      else if (e.key === "m") toggleMute();
      else if (e.key === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, toggleMute, toggleFullscreen]);

  /* ---------- seeking ---------- */
  const fractionAt = (clientX: number) => {
    const r = progressRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const onProgressDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!duration) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setScrubbing(true);
    setCurrent(fractionAt(e.clientX) * duration);
  };
  const onProgressMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const f = fractionAt(e.clientX);
    setHoverX(f);
    if (scrubbing) setCurrent(f * duration);
  };
  const onProgressUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbing) return;
    setScrubbing(false);
    const t = fractionAt(e.clientX) * duration;
    adapterRef.current?.seek(t);
    setCurrent(t);
  };

  const played = duration ? current / duration : 0;
  const hd = quality.includes("HD");

  return (
    <div ref={wrapRef} className={`${styles.player} ${theater ? styles.playerTheater : ""}`}>
      <div className={styles.videoBox}>
        {video.src ? (
          <video ref={localRef} className={styles.videoEl} src={video.src} playsInline />
        ) : (
          <div ref={mountRef} className={styles.videoEl} />
        )}

        {/* Click shield: keeps users inside our page and makes the video clickable */}
        <div className={styles.shield} onClick={toggle} onDoubleClick={toggleFullscreen}>
          {!started && ready && (
            <button
              className={styles.bigPlay}
              aria-label="Play"
              onClick={(e) => {
                e.stopPropagation();
                play();
              }}
            >
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path d="M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3.2 34 .2 34 .2S12.7.2 7.4 1.6c-2.9.8-5.1 3.1-5.9 6C0 13 0 24 0 24s0 11 1.5 16.3c.8 2.9 3 5.2 5.9 6C12.7 47.8 34 47.8 34 47.8s21.3 0 26.6-1.5c2.9-.8 5.1-3.1 5.9-6C68 35 68 24 68 24s0-11-1.5-16.3z" fill="#1f1f1e" fillOpacity=".85" />
                <path d="M45 24 27 14v20" fill="#fff" />
              </svg>
            </button>
          )}
          {(!ready || buffering) && <div className={styles.spinner} />}
          {flash && (
            <div className={styles.flash} key={flash + current}>
              {flash === "play" ? <PlayIcon /> : <PauseIcon />}
            </div>
          )}
          {ended && (
            <div className={styles.endScreen}>
              <ReplayIcon />
              <span>Replay</span>
            </div>
          )}
          {annotations && started && current > 2 && current < 7 && (
            <div className={styles.annotation}>
              Click here to subscribe!
            </div>
          )}
        </div>
      </div>

      {/* ---------- 2010s control bar ---------- */}
      <div className={styles.controls}>
        <div
          ref={progressRef}
          className={styles.progress}
          onPointerDown={onProgressDown}
          onPointerMove={onProgressMove}
          onPointerUp={onProgressUp}
          onPointerLeave={() => setHoverX(null)}
        >
          <div className={styles.progressBuffered} style={{ width: `${buffered * 100}%` }} />
          <div className={styles.progressPlayed} style={{ width: `${played * 100}%` }} />
          <div className={styles.progressThumb} style={{ left: `${played * 100}%` }} />
          {hoverX !== null && duration > 0 && (
            <div className={styles.progressTip} style={{ left: `${hoverX * 100}%` }}>
              {fmt(hoverX * duration)}
            </div>
          )}
        </div>

        <div className={styles.controlRow}>
          <button className={styles.ctrlBtn} onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {ended ? <ReplayIcon small /> : playing ? <PauseIcon small /> : <PlayIcon small />}
          </button>
          <button className={styles.ctrlBtn} onClick={onNext} aria-label="Next">
            <NextIcon />
          </button>
          <div className={styles.volume}>
            <button className={styles.ctrlBtn} onClick={toggleMute} aria-label="Mute">
              <VolumeIcon level={muted ? 0 : volume} />
            </button>
            <input
              className={styles.volumeSlider}
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => setVol(Number(e.target.value))}
              aria-label="Volume"
            />
          </div>
          <span className={styles.time}>
            {fmt(current)} / {fmt(duration)}
          </span>

          <div className={styles.ctrlRight}>
            <div className={styles.settingsWrap}>
              <button
                className={`${styles.ctrlBtn} ${settingsOpen ? styles.ctrlBtnActive : ""}`}
                onClick={() => setSettingsOpen((o) => !o)}
                aria-label="Settings"
              >
                <GearIcon />
                {hd && <span className={styles.hdBadge}>HD</span>}
              </button>
              {settingsOpen && (
                <div className={styles.settingsMenu}>
                  <div className={styles.settingsRow}>
                    <span>Annotations</span>
                    <button className={styles.settingsToggle} onClick={() => setAnnotations((a) => !a)}>
                      {annotations ? "On" : "Off"}
                    </button>
                  </div>
                  <div className={styles.settingsRow}>
                    <span>Speed</span>
                    <select
                      value={speed}
                      onChange={(e) => {
                        const r = Number(e.target.value);
                        setSpeed(r);
                        adapterRef.current?.setRate(r);
                      }}
                    >
                      {SPEEDS.map((s) => (
                        <option key={s} value={s}>
                          {s === 1 ? "Normal" : s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.settingsLabel}>Quality</div>
                  <div className={styles.qualityList}>
                    {QUALITIES.map((q) => (
                      <button
                        key={q}
                        className={`${styles.qualityItem} ${q === quality ? styles.qualityActive : ""}`}
                        onClick={() => {
                          setQuality(q);
                          setSettingsOpen(false);
                          setBuffering(true);
                          setTimeout(() => setBuffering(false), 700);
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className={`${styles.ctrlBtn} ${theater ? styles.ctrlBtnActive : ""}`} onClick={onToggleTheater} aria-label="Theater mode">
              <TheaterIcon />
            </button>
            <button className={styles.ctrlBtn} onClick={toggleFullscreen} aria-label="Full screen">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
function PlayIcon({ small }: { small?: boolean }) {
  const s = small ? 22 : 48;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M7 4v16l13-8z" fill="currentColor" />
    </svg>
  );
}
function PauseIcon({ small }: { small?: boolean }) {
  const s = small ? 22 : 48;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
    </svg>
  );
}
function ReplayIcon({ small }: { small?: boolean }) {
  const s = small ? 22 : 56;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path
        d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"
        fill="currentColor"
      />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M5 4v16l11-8zM17 4h3v16h-3z" fill="currentColor" />
    </svg>
  );
}
function VolumeIcon({ level }: { level: number }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9z" fill="currentColor" />
      {level > 0 && <path d="M16.5 12A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z" fill="currentColor" />}
      {level > 50 && <path d="M14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" fill="currentColor" />}
      {level === 0 && <path d="M15 9l6 6M21 9l-6 6" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.5 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1L11 21h4l.4-2.9c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z"
      />
    </svg>
  );
}
function TheaterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <rect x="2" y="6" width="20" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
