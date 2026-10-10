"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { CALLER, ROUTES, TIMINGS, USER_LABEL } from "@/lib/experience";
import { playDropout, unlockAudio } from "@/lib/sounds";
import {
  ALWAYS_SHOW_CAPTIONS,
  CALL_VIDEO_SRC,
  FILLERS,
  LAG_AFTER_SCRIPT,
  LAG_SEGMENT,
  LISTENING_LOOP,
  MUTED_SEGMENT,
  SEGMENTS,
  VAD,
  type Segment,
} from "./callScript";
import { useMic } from "./useMic";
import styles from "./zoomCall.module.css";

type Phase = "audio" | "connecting" | "live" | "lag" | "ended";
type Token = { aborted: boolean };
type ListenResult = "answered" | "timeout" | "muted" | "aborted";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Raw mic signal: the browser's auto-gain / noise filter make speech and silence look alike. */
const AUDIO_CONSTRAINTS = { echoCancellation: true, noiseSuppression: false, autoGainControl: false };

function cameraErrorText(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError") return "Camera blocked. Allow camera access in the address bar.";
  if (name === "NotReadableError") return "Camera is being used by another app (Teams, Zoom, OBS…). Close it and click Start Video.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera found.";
  return "Can't start camera.";
}


export default function ZoomCall() {
  const router = useRouter();
  const mic = useMic();

  const [phase, setPhase] = useState<Phase>("audio");
  const [placeholder, setPlaceholder] = useState(!CALL_VIDEO_SRC);
  const [remoteTalking, setRemoteTalking] = useState(false);
  const [caption, setCaption] = useState("");
  const [muted, setMuted] = useState(false);
  const [panel, setPanel] = useState<null | "chat" | "participants">(null);
  const [toast, setToast] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [lagSpinner, setLagSpinner] = useState(false);
  const [chat, setChat] = useState<{ from: string; text: string }[]>([]);
  const [chatText, setChatText] = useState("");

  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);
  const [mics, setMics] = useState<{ id: string; label: string }[]>([]);
  const [micId, setMicId] = useState("");
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const camStreamRef = useRef<MediaStream | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const freezeRef = useRef<HTMLCanvasElement>(null);
  const placeholderRef = useRef(placeholder);
  const mutedRef = useRef(false);
  const manualAnswerRef = useRef(false);
  const micStatusRef = useRef(mic.status);

  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    micStatusRef.current = mic.status;
  }, [mic.status]);

  /* ---------- is the recorded video there yet? ---------- */
  useEffect(() => {
    if (!CALL_VIDEO_SRC) return;
    fetch(CALL_VIDEO_SRC, { method: "HEAD" })
      .then((r) => {
        if (!r.ok) setPlaceholder(true);
      })
      .catch(() => setPlaceholder(true));
  }, []);

  useEffect(() => {
    router.prefetch(ROUTES.google);
  }, [router]);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  /* ================================================================ */
  /* Speaking & listening                                              */
  /* ================================================================ */
  const speak = useCallback((seg: Segment, token: Token) => {
    return new Promise<void>((resolve) => {
      if (token.aborted) return resolve();
      const v = videoRef.current;
      const finish = () => {
        setRemoteTalking(false);
        setCaption("");
        resolve();
      };

      // Real video
      if (!placeholderRef.current && v) {
        if (seg.start == null || seg.end == null) return resolve(); // no clip recorded for this line
        setRemoteTalking(true);
        setCaption(seg.text);
        v.loop = false;
        v.muted = false;
        v.currentTime = seg.start;
        void v.play().catch(() => {});
        const iv = setInterval(() => {
          if (token.aborted) {
            clearInterval(iv);
            v.pause();
            setRemoteTalking(false);
            return resolve();
          }
          if (v.currentTime >= (seg.end as number) || v.ended) {
            clearInterval(iv);
            v.pause();
            finish();
          }
        }, 30);
        return;
      }

      // Placeholder: browser text-to-speech
      setRemoteTalking(true);
      setCaption(seg.text);
      const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
      if (!synth) {
        setTimeout(finish, 1200 + seg.text.length * 60);
        return;
      }
      let done = false;
      const end = () => {
        if (done) return;
        done = true;
        clearInterval(iv);
        clearTimeout(safety);
        finish();
      };
      const u = new SpeechSynthesisUtterance(seg.text);
      u.rate = 1.03;
      u.pitch = 1.05;
      u.onend = end;
      u.onerror = end;
      const safety = setTimeout(end, 2500 + seg.text.length * 85);
      const iv = setInterval(() => {
        if (token.aborted) {
          synth.cancel();
          end();
        }
      }, 50);
      synth.cancel();
      synth.speak(u);
    });
  }, []);

  const listen = useCallback(
    (token: Token, allowMutedNudge: boolean) => {
      return new Promise<ListenResult>((resolve) => {
        const v = videoRef.current;
        const useLoop = !placeholderRef.current && v && LISTENING_LOOP;
        if (useLoop && v) {
          v.muted = true;
          v.currentTime = LISTENING_LOOP!.start;
          void v.play().catch(() => {});
        }
        manualAnswerRef.current = false;
        const begin = performance.now();
        let last = begin;
        let voiced = 0;
        let started = false;
        let lastVoice = 0;

        const finish = (r: ListenResult) => {
          clearInterval(iv);
          if (useLoop && v) {
            v.pause();
            v.muted = false;
          }
          resolve(r);
        };

        const iv = setInterval(() => {
          const now = performance.now();
          const dt = now - last;
          last = now;
          if (token.aborted) return finish("aborted");
          if (useLoop && v && v.currentTime >= LISTENING_LOOP!.end) v.currentTime = LISTENING_LOOP!.start;
          if (now - begin < VAD.listenDelayMs) return;
          if (manualAnswerRef.current) return finish("answered");

          const micOn = micStatusRef.current === "on";
          const level = mic.levelRef.current;
          const active = micOn && !mutedRef.current;
          // start of speech needs the (higher) speech threshold…
          const loud = active && level > mic.thresholdRef.current;
          // …but once they're talking, anything above the (lower) silence level still counts
          const stillTalking = active && started && level > mic.silenceRef.current;
          if (loud) {
            voiced += dt;
            if (voiced >= VAD.minSpeechMs) started = true;
          } else {
            voiced = Math.max(0, voiced - dt * 0.5);
          }
          if (loud || stillTalking) lastVoice = now;

          if (started && now - lastVoice > VAD.endSilenceMs) return finish("answered");
          if (!started && allowMutedNudge && micOn && mutedRef.current && now - begin > 5000) return finish("muted");
          const timeout = micOn ? VAD.noAnswerTimeoutMs : VAD.noMicTimeoutMs;
          if (!started && now - begin > timeout) return finish("timeout");
        }, 20);
      });
    },
    [mic.levelRef, mic.thresholdRef, mic.silenceRef],
  );

  /* ================================================================ */
  /* The conversation (phase: live)                                    */
  /* ================================================================ */
  useEffect(() => {
    if (phase !== "live") return;
    const token: Token = { aborted: false };
    let mutedNudged = false;

    const waitForAnswer = async (): Promise<ListenResult> => {
      for (;;) {
        const r = await listen(token, !mutedNudged && !!MUTED_SEGMENT);
        if (r === "muted") {
          mutedNudged = true;
          if (MUTED_SEGMENT) await speak(MUTED_SEGMENT, token);
          continue;
        }
        return r;
      }
    };

    const run = async () => {
      await sleep(700);
      for (const seg of SEGMENTS) {
        if (token.aborted) return;
        await speak(seg, token);
        if (token.aborted) return;
        if (seg.waitForAnswer && (await waitForAnswer()) === "aborted") return;
      }
      // Script done → the lag kicks in right after the last answer (no awkward waiting).
      if (LAG_AFTER_SCRIPT) {
        await sleep(400);
        if (!token.aborted) setPhase("lag");
        return;
      }
      let k = 0;
      while (!token.aborted) {
        const r = await waitForAnswer();
        if (r === "aborted") return;
        if (r === "answered" && FILLERS.length) await speak(FILLERS[k++ % FILLERS.length], token);
      }
    };
    void run();

    const glitchTimer = setTimeout(() => setPhase("lag"), TIMINGS.callBeforeGlitchMs);
    return () => {
      token.aborted = true;
      clearTimeout(glitchTimer);
    };
  }, [phase, listen, speak]);

  /* ================================================================ */
  /* The lag (phase: lag)                                              */
  /* ================================================================ */
  useEffect(() => {
    if (phase !== "lag") return;
    const token: Token = { aborted: false };
    videoRef.current?.pause(); // freeze on whatever frame we were on
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    const t = setTimeout(async () => {
      await speak(LAG_SEGMENT, token);
      if (!token.aborted) setPhase("ended");
    }, TIMINGS.glitchLeadMs);
    return () => {
      token.aborted = true;
      clearTimeout(t);
    };
  }, [phase, speak]);

  /* Visual + audio glitch driver */
  useEffect(() => {
    if (phase !== "lag") return;
    const root = rootRef.current;
    if (!root) return;
    let alive = true;
    const t0 = performance.now();
    const total = TIMINGS.glitchLeadMs + 9000;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

    const freeze = (pixel: number, hold: number) => {
      const v = videoRef.current;
      const c = freezeRef.current;
      if (!v || !c || placeholderRef.current || !v.videoWidth) return;
      const w = Math.max(8, Math.round(c.clientWidth / pixel));
      const h = Math.max(6, Math.round(c.clientHeight / pixel));
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(v, 0, 0, w, h);
      c.style.opacity = "1";
      later(() => {
        if (c) c.style.opacity = "0";
      }, hold);
    };

    const step = () => {
      if (!alive) return;
      const r = Math.random;
      const k = Math.min(1, 0.35 + (performance.now() - t0) / total);
      const hit = r() < 0.6 * k;
      const s = root.style;
      s.setProperty("--gx", hit ? `${(r() - 0.5) * 36 * k}px` : "0px");
      s.setProperty("--gy", hit ? `${(r() - 0.5) * 10 * k}px` : "0px");
      s.setProperty("--skew", hit ? `${(r() - 0.5) * 5 * k}deg` : "0deg");
      s.setProperty("--hue", r() < 0.3 * k ? `${r() * 120}deg` : "0deg");
      s.setProperty("--blur", r() < 0.2 * k ? `${(r() * 3).toFixed(1)}px` : "0px");
      s.setProperty("--contrast", r() < 0.25 * k ? `${1 + r() * 1.5}` : "1");
      for (let i = 0; i < 3; i++) {
        const on = r() < 0.45 * k;
        s.setProperty(`--t${i}-top`, `${(r() * 100).toFixed(1)}%`);
        s.setProperty(`--t${i}-h`, `${(2 + r() * 70 * k).toFixed(0)}px`);
        s.setProperty(`--t${i}-x`, `${((r() - 0.5) * 140 * k).toFixed(0)}px`);
        s.setProperty(`--t${i}-o`, on ? "1" : "0");
      }
      if (r() < 0.35 * k) freeze(6 + r() * 34 * k, 120 + r() * 650);
      if (r() < 0.22 * k) {
        const v = videoRef.current;
        if (v && !placeholderRef.current) {
          v.muted = true;
          later(() => {
            if (v) v.muted = false;
          }, 80 + r() * 320);
        } else if (typeof window !== "undefined" && window.speechSynthesis?.speaking) {
          window.speechSynthesis.pause();
          later(() => window.speechSynthesis.resume(), 120 + r() * 380);
        }
        if (r() < 0.35) playDropout();
      }
      setLagSpinner(r() < 0.18 * k);
      later(step, 50 + r() * 220);
    };
    step();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      window.speechSynthesis?.resume();
    };
  }, [phase]);

  /* ================================================================ */
  /* End of call                                                       */
  /* ================================================================ */
  useEffect(() => {
    if (phase !== "ended") return;
    mic.stop();
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    setCamOn(false);
    videoRef.current?.pause();
    window.speechSynthesis?.cancel();
    const t = setTimeout(() => router.push(ROUTES.google), TIMINGS.callEndedMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* Space / Enter = "I answered" (handy for testing without a mic) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        manualAnswerRef.current = true;
      }
      // press D to see the mic meter (for tuning)
      if (e.key === "d" || e.key === "D") setDebug((d) => !d);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- webcam ---------- */
  const attachCamera = useCallback((stream: MediaStream) => {
    const tracks = stream.getVideoTracks();
    if (!tracks.length) return false;
    const camOnly = new MediaStream(tracks);
    camStreamRef.current = camOnly;
    setCamStream(camOnly);
    setCamOn(true);
    setCamError(null);
    return true;
  }, []);

  const startCamera = useCallback(async () => {
    if (camStreamRef.current) {
      camStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = true));
      setCamOn(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      attachCamera(stream);
    } catch (err) {
      setCamOn(false);
      setCamError(cameraErrorText(err));
    }
  }, [attachCamera]);

  const stopCamera = useCallback(() => {
    camStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = false));
    setCamOn(false);
  }, []);

  // attach the stream to the self-view whenever both exist
  useEffect(() => {
    const el = selfVideoRef.current;
    if (el && camStream && el.srcObject !== camStream) {
      el.srcObject = camStream;
      void el.play().catch(() => {});
    }
  }, [camStream, camOn]);

  // release the camera when leaving the page
  useEffect(
    () => () => {
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
      camStreamRef.current = null;
    },
    [],
  );

  /* ---------- camera + mic setup (starts as soon as the join dialog shows, like Zoom's preview) ---------- */
  const listMics = useCallback(async (activeStream?: MediaStream | null) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, i) => ({ id: d.deviceId, label: d.label || `Microphone ${i + 1}` }));
      setMics(inputs);
      const current = activeStream?.getAudioTracks()[0]?.getSettings().deviceId;
      if (current) setMicId(current);
    } catch {
      /* ignore */
    }
  }, []);

  const mediaStarted = useRef(false);
  const setupMedia = useCallback(async () => {
    if (mediaStarted.current) return;
    mediaStarted.current = true;
    let stream: MediaStream | null = null;
    try {
      // One permission prompt for camera + mic, like real Zoom.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      });
    } catch (err) {
      // camera failed (blocked / in use) → still try the mic on its own
      setCamError(cameraErrorText(err));
    }
    if (stream) attachCamera(stream);
    await mic.start(stream);
    void listMics(stream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachCamera, listMics, mic.start]);

  useEffect(() => {
    void setupMedia();
  }, [setupMedia]);

  const switchMic = async (id: string) => {
    setMicId(id);
    mic.stop();
    try {
      const s2 = await navigator.mediaDevices.getUserMedia({ audio: { ...AUDIO_CONSTRAINTS, deviceId: { exact: id } } });
      await mic.start(s2);
    } catch {
      await mic.start();
    }
  };

  const joinAudio = async () => {
    unlockAudio();
    // prime the video element inside the click so the browser allows sound later
    const v = videoRef.current;
    if (v && !placeholderRef.current) {
      v.muted = true;
      void v.play().then(() => {
        v.pause();
        v.currentTime = 0;
        v.muted = false;
      }).catch(() => {});
    }
    // prime speech synthesis inside the click too (Safari)
    if (placeholderRef.current && window.speechSynthesis) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    }
    setPhase("connecting");
    await setupMedia();
    setTimeout(() => setPhase("live"), 1400);
  };

  const lagging = phase === "lag";
  const userTalking = mic.speaking && !muted && phase !== "ended";
  const showCaptions = (placeholder || ALWAYS_SHOW_CAPTIONS) && !!caption;

  return (
    <div ref={rootRef} className={`${styles.window} ${lagging ? styles.lagging : ""}`}>
      {/* ---------- title bar ---------- */}
      <div className={styles.titleBar}>
        <span className={styles.titleShield}>
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path d="M12 2l8 3v6c0 5-3.4 9.5-8 11-4.6-1.5-8-6-8-11V5z" fill="#23d959" />
          </svg>
        </span>
        <span className={styles.titleText}>
          Zoom Meeting ID: 341-067-841 Participant ID: 38{lagging ? " (Not Responding)" : ""}
        </span>
        <div className={styles.winControls}>
          <button aria-label="Minimise" onClick={() => flashToast("Nice try.")}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 9h8" stroke="#bbb" strokeWidth="1.5" />
            </svg>
          </button>
          <button aria-label="Maximise" onClick={() => flashToast("It's already big enough.")}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke="#bbb" strokeWidth="1.3" />
            </svg>
          </button>
          <button aria-label="Close" className={styles.winClose} onClick={() => setLeaveOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 3l6 6M9 3l-6 6" stroke="#fff" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>

      {lagging && (
        <div className={styles.unstable}>
          <WifiIcon /> Your Internet connection is unstable.
        </div>
      )}

      {/* ---------- stage ---------- */}
      <div className={styles.body}>
        <div className={styles.stage}>
          <div className={`${styles.tile} ${remoteTalking && phase !== "ended" ? styles.tileActive : ""}`}>
            {CALL_VIDEO_SRC && !placeholder && (
              <video
                ref={videoRef}
                className={styles.remoteVideo}
                src={CALL_VIDEO_SRC}
                playsInline
                preload="auto"
                onError={() => setPlaceholder(true)}
                style={{ opacity: phase === "audio" || phase === "connecting" ? 0 : 1 }}
              />
            )}
            {(placeholder || phase === "audio" || phase === "connecting") && (
              <div className={styles.namePlate}>
                {phase === "connecting" ? <span className={styles.connecting}>Connecting…</span> : CALLER.name}
              </div>
            )}
            <canvas ref={freezeRef} className={styles.freeze} />
            {lagging && lagSpinner && <div className={styles.lagSpinner} />}
            {showCaptions && <div className={styles.caption}>{caption}</div>}
            <span className={styles.label}>
              {CALLER.name}
            </span>
          </div>

          <div className={`${styles.tile} ${styles.selfTile} ${userTalking ? styles.tileActive : ""}`}>
            {camStream && (
              <video
                ref={selfVideoRef}
                className={styles.selfVideo}
                autoPlay
                muted
                playsInline
                style={{ opacity: camOn ? 1 : 0 }}
              />
            )}
            {!camOn && <div className={styles.selfName}>You</div>}
            {!camOn && camError && phase !== "audio" && <div className={styles.camError}>{camError}</div>}
            <span className={styles.label}>
              {muted && <MicOffSmall />}
              {USER_LABEL}
            </span>
          </div>

          {/* glitch tears */}
          {lagging && (
            <>
              <div className={styles.tear} data-i="0" />
              <div className={styles.tear} data-i="1" />
              <div className={styles.tear} data-i="2" />
            </>
          )}
        </div>

        {panel && (
          <aside className={styles.panel}>
            <div className={styles.panelHead}>
              {panel === "chat" ? "Meeting Chat" : "Participants (2)"}
              <button onClick={() => setPanel(null)} aria-label="Close panel">
                ×
              </button>
            </div>
            {panel === "participants" ? (
              <div className={styles.participants}>
                <div className={styles.participant}>
                  <span className={styles.pAvatar}>{CALLER.name.charAt(0)}</span>
                  {CALLER.name} (Host)
                  <span className={styles.pIcons}>
                    <MicSmall /> <CamSmall />
                  </span>
                </div>
                <div className={styles.participant}>
                  <span className={styles.pAvatar}>Y</span>
                  {USER_LABEL} (Me)
                  <span className={styles.pIcons}>{muted ? <MicOffSmall /> : <MicSmall />}</span>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.chatLog}>
                  {chat.length === 0 && <div className={styles.chatEmpty}>Messages addressed to &quot;Everyone&quot; will appear here.</div>}
                  {chat.map((m, i) => (
                    <div key={i} className={styles.chatMsg}>
                      <div className={styles.chatFrom}>{m.from} to Everyone</div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                </div>
                <form
                  className={styles.chatForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatText.trim()) return;
                    setChat((c) => [...c, { from: "Me", text: chatText.trim() }]);
                    setChatText("");
                  }}
                >
                  <input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Type message here…" />
                </form>
              </>
            )}
          </aside>
        )}
      </div>

      {/* ---------- toolbar ---------- */}
      <div className={styles.toolbar}>
        <div className={styles.tbGroup}>
          <ToolButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
            {muted ? <MicOffIcon /> : <MicLevelIcon levelRef={mic.levelRef} active={mic.status === "on"} />}
          </ToolButton>
          <ToolButton label={camOn ? "Stop Video" : "Start Video"} onClick={() => (camOn ? stopCamera() : void startCamera())}>
            {camOn ? <CamIcon /> : <CamOffIcon />}
          </ToolButton>
        </div>
        <div className={styles.tbGroup}>
          <ToolButton label="Invite" onClick={() => flashToast("Invite link copied to clipboard.")}>
            <InviteIcon />
          </ToolButton>
          <ToolButton label="Manage Participants" badge="2" onClick={() => setPanel(panel === "participants" ? null : "participants")}>
            <ParticipantsIcon />
          </ToolButton>
          <ToolButton label="Share" onClick={() => flashToast("Host disabled participant screen sharing.")}>
            <ShareIcon />
          </ToolButton>
          <ToolButton label="Chat" onClick={() => setPanel(panel === "chat" ? null : "chat")}>
            <ChatIcon />
          </ToolButton>
          <ToolButton label="Record" onClick={() => flashToast("You need the host's permission to record.")}>
            <RecordIcon />
          </ToolButton>
          <ToolButton label="Breakout Rooms" onClick={() => flashToast("Only the host can open breakout rooms.")}>
            <BreakoutIcon />
          </ToolButton>
        </div>
        <button className={styles.endBtn} onClick={() => setLeaveOpen(true)}>
          End Meeting
        </button>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {leaveOpen && (
        <div className={styles.modalBackdrop} onClick={() => setLeaveOpen(false)}>
          <div className={styles.leaveBox} onClick={(e) => e.stopPropagation()}>
            <p>The host has disabled leaving this meeting.</p>
            <button onClick={() => setLeaveOpen(false)}>Okay…</button>
          </div>
        </div>
      )}

      {/* ---------- join audio ---------- */}
      {phase === "audio" && (
        <div className={styles.modalBackdrop}>
          <div className={styles.audioBox}>
            <div className={styles.audioTabs}>
              <span className={styles.audioTabActive}>Computer Audio</span>
              <span>Phone Call</span>
            </div>
            <div className={styles.micTest}>
              <label className={styles.micLabel}>
                Microphone
                <select value={micId} onChange={(e) => void switchMic(e.target.value)} disabled={!mics.length}>
                  {!mics.length && <option value="">{mic.status === "denied" ? "No microphone access" : "Waiting for permission…"}</option>}
                  {mics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <MicMeter mic={mic} />
              <span className={styles.micHint}>
                {mic.status === "denied"
                  ? "Allow microphone access in the address bar, then reload."
                  : mic.speaking
                    ? "We can hear you!"
                    : "Say something: the bar should turn green."}
              </span>
            </div>
            <button className={styles.audioJoin} onClick={joinAudio}>
              Join with Computer Audio
            </button>
            <button className={styles.audioTest} onClick={joinAudio}>
              Test Speaker and Microphone
            </button>
            <label className={styles.audioCheck}>
              <input type="checkbox" defaultChecked /> Automatically join audio by computer when joining a meeting
            </label>
          </div>
        </div>
      )}

      {phase === "ended" && (
        <div className={styles.modalBackdrop}>
          <div className={styles.endedBox}>
            <p>This meeting has been ended by host</p>
            <button onClick={() => router.push(ROUTES.google)}>OK</button>
          </div>
        </div>
      )}

      {debug && <MicDebug mic={mic} />}

      {mic.status === "denied" && phase === "live" && (
        <div className={styles.micWarning}>Zoom can&apos;t hear you. Allow microphone access so {CALLER.name} can hear you.</div>
      )}
    </div>
  );
}

/* ================================================================== */
/** Input-level bar used in the join dialog (like Zoom's "Test Microphone"). */
function MicMeter({ mic }: { mic: { levelRef: RefObject<number>; thresholdRef: RefObject<number>; speaking: boolean } }) {
  const barRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const scale = (v: number) => `${Math.min(100, Math.sqrt(v / 0.15) * 100)}%`;
    const loop = () => {
      if (barRef.current) barRef.current.style.width = scale(mic.levelRef.current ?? 0);
      if (lineRef.current) lineRef.current.style.left = scale(mic.thresholdRef.current ?? 0);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [mic]);
  return (
    <div className={styles.meter}>
      <div ref={barRef} className={styles.meterBar} style={{ background: mic.speaking ? "#23d959" : "#b5b5b5" }} />
      <div ref={lineRef} className={styles.meterLine} />
    </div>
  );
}

/** Press D during the call: live mic level vs. the speech / silence lines. */
function MicDebug({
  mic,
}: {
  mic: {
    levelRef: RefObject<number>;
    floorRef: RefObject<number>;
    thresholdRef: RefObject<number>;
    silenceRef: RefObject<number>;
    speaking: boolean;
  };
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const thrRef = useRef<HTMLDivElement>(null);
  const silRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const scale = (v: number) => `${Math.min(100, Math.sqrt(v / 0.3) * 100)}%`;
    const loop = () => {
      const l = mic.levelRef.current ?? 0;
      if (barRef.current) barRef.current.style.width = scale(l);
      if (thrRef.current) thrRef.current.style.left = scale(mic.thresholdRef.current ?? 0);
      if (silRef.current) silRef.current.style.left = scale(mic.silenceRef.current ?? 0);
      if (txtRef.current)
        txtRef.current.textContent = `level ${l.toFixed(4)} · room ${(mic.floorRef.current ?? 0).toFixed(4)} · speech > ${(mic.thresholdRef.current ?? 0).toFixed(4)}`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [mic]);
  return (
    <div className={styles.debug}>
      <div className={styles.debugTrack}>
        <div ref={barRef} className={styles.debugBar} style={{ background: mic.speaking ? "#23d959" : "#888" }} />
        <div ref={silRef} className={styles.debugLine} style={{ background: "#f5a623" }} />
        <div ref={thrRef} className={styles.debugLine} style={{ background: "#23d959" }} />
      </div>
      <div ref={txtRef} className={styles.debugText} />
    </div>
  );
}

function ToolButton({
  label,
  children,
  onClick,
  badge,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button className={styles.tb} onClick={onClick}>
      <span className={styles.tbIcon}>
        {children}
        {badge && <span className={styles.tbBadge}>{badge}</span>}
      </span>
      <span className={styles.tbLabel}>{label}</span>
    </button>
  );
}

function MicLevelIcon({ levelRef, active }: { levelRef: RefObject<number>; active: boolean }) {
  const fillRef = useRef<SVGRectElement>(null);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      const lvl = Math.min(1, (levelRef.current ?? 0) * 9);
      if (fillRef.current) {
        const h = 12 * lvl;
        fillRef.current.setAttribute("y", String(15 - h));
        fillRef.current.setAttribute("height", String(h));
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [active, levelRef]);
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <defs>
        <clipPath id="micClip">
          <rect x="9" y="3" width="6" height="12" rx="3" />
        </clipPath>
      </defs>
      <rect x="9" y="3" width="6" height="12" rx="3" fill="none" stroke="#fff" strokeWidth="1.6" />
      <rect ref={fillRef} x="9" y="15" width="6" height="0" fill="#23d959" clipPath="url(#micClip)" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" fill="none" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

const ic = { fill: "none", stroke: "#fff", strokeWidth: 1.6 } as const;
function MicOffIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="12" rx="3" {...ic} />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" {...ic} />
      <path d="M4 3l16 18" stroke="#e02828" strokeWidth="2" />
    </svg>
  );
}
function CamIcon() {
  return (
    <svg width="28" height="26" viewBox="0 0 26 24">
      <rect x="2" y="6" width="15" height="12" rx="2.5" fill="#fff" />
      <path d="M18 10l6-3.5v11L18 14z" fill="#fff" />
    </svg>
  );
}
function CamOffIcon() {
  return (
    <svg width="28" height="26" viewBox="0 0 26 24">
      <rect x="2" y="6" width="15" height="12" rx="2.5" fill="#fff" />
      <path d="M18 10l6-3.5v11L18 14z" fill="#fff" />
      <path d="M3 3l20 18" stroke="#e02828" strokeWidth="2.2" />
    </svg>
  );
}
function InviteIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <circle cx="10" cy="8" r="4" fill="#fff" />
      <path d="M2 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z" fill="#fff" />
      <path d="M19 6v6M16 9h6" stroke="#fff" strokeWidth="1.8" />
    </svg>
  );
}
function ParticipantsIcon() {
  return (
    <svg width="28" height="26" viewBox="0 0 26 24">
      <circle cx="9" cy="8" r="4" fill="#fff" />
      <circle cx="18" cy="8" r="3.2" fill="#fff" />
      <path d="M1 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5zM18 12.5c3.8 0 7 2 7 6.5h-6" fill="#fff" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#23d959" />
      <path d="M12 16V8M8.5 11.5L12 8l3.5 3.5" stroke="#fff" strokeWidth="2" fill="none" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" />
    </svg>
  );
}
function RecordIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" {...ic} />
      <circle cx="12" cy="12" r="5" fill="#fff" />
    </svg>
  );
}
function BreakoutIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#fff" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#fff" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#fff" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#fff" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0" fill="none" stroke="#f5a623" strokeWidth="2.2" />
      <circle cx="12" cy="19.5" r="1.6" fill="#f5a623" />
    </svg>
  );
}
function MicSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="12" rx="3" fill="#ccc" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="#ccc" strokeWidth="2" />
    </svg>
  );
}
function MicOffSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <rect x="9" y="3" width="6" height="12" rx="3" fill="#e02828" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="#e02828" strokeWidth="2" />
      <path d="M4 3l16 18" stroke="#e02828" strokeWidth="2.4" />
    </svg>
  );
}
function CamSmall() {
  return (
    <svg width="16" height="14" viewBox="0 0 26 24">
      <rect x="2" y="6" width="15" height="12" rx="2.5" fill="#ccc" />
      <path d="M18 10l6-3.5v11L18 14z" fill="#ccc" />
    </svg>
  );
}