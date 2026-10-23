"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "@/lib/sounds";

/**
 * Microphone voice detector.
 *
 * - Auto gain control and noise suppression are OFF: the browser's AGC boosts
 *   room noise during silence and squashes your voice while talking, which
 *   made speech and silence look almost the same. We use the raw signal.
 * - The mic signal is band-passed to the human-voice range (fans, hum and
 *   hiss are mostly ignored).
 * - "Room noise" = the quietest moments of the last few seconds (a low
 *   percentile), so it can't creep up while you're talking.
 * - "Speech" = clearly louder than the room (about +9 dB), "silence" = back
 *   near the room level (about +4 dB). Works for quiet and loud mics alike.
 * - BUSY ROOM mode (toggle in the join dialog, remembered per browser): other
 *   people talking count as "room", so you have to be clearly louder than them
 *   (about +13 dB). The call also uses your own voice level to see when you stop.
 *
 * `start(stream?)` can reuse a stream that already has an audio track
 * (e.g. one getUserMedia call for camera + mic, like real Zoom).
 */
export function useMic() {
  const levelRef = useRef(0);
  const floorRef = useRef(0.002);
  const thresholdRef = useRef(0.006);
  const silenceRef = useRef(0.0035);
  const ratioRef = useRef(2.8);
  const [busy, setBusyState] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "on" | "denied">("idle");
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const start = useCallback(async (existing?: MediaStream | null) => {
    if (streamRef.current) return true;
    setStatus("requesting");
    try {
      let stream: MediaStream;
      if (existing && existing.getAudioTracks().length) {
        stream = new MediaStream(existing.getAudioTracks());
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
        });
      }
      streamRef.current = stream;
      const ctx = getAudioContext();
      if (!ctx) throw new Error("no audio context");
      await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 100;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 4000;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // ~10ms windows: fast reaction
      source.connect(highpass).connect(lowpass).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      // ring buffer of recent levels (20ms each → 5 seconds)
      const HISTORY = 250;
      const history = new Float32Array(HISTORY).fill(0);
      let hIndex = 0;
      let hCount = 0;
      const sorted = new Float32Array(HISTORY);
      let tick = 0;
      let speakingNow = false;
      let lastLoud = 0;

      const id = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);

        // fast attack, fast release
        const prev = levelRef.current;
        levelRef.current = rms > prev ? prev * 0.3 + rms * 0.7 : prev * 0.5 + rms * 0.5;

        history[hIndex] = rms;
        hIndex = (hIndex + 1) % HISTORY;
        hCount = Math.min(HISTORY, hCount + 1);

        // re-estimate the room level every 100ms: 15th percentile of recent levels
        if (tick++ % 5 === 0 && hCount > 10) {
          sorted.set(history);
          const view = sorted.subarray(0, hCount).sort();
          const floor = Math.max(0.0002, view[Math.floor(hCount * 0.15)]);
          floorRef.current = floor;
          thresholdRef.current = Math.max(0.0015, floor * ratioRef.current); // ≈ +9 dB (+13 dB busy) above the room
          silenceRef.current = Math.max(0.001, floor * 1.6); //  ≈ +4 dB above the room
        }

        const now = performance.now();
        if (levelRef.current > thresholdRef.current) lastLoud = now;
        const next = now - lastLoud < 250;
        if (next !== speakingNow) {
          speakingNow = next;
          setSpeaking(next);
        }
      }, 20);

      stopRef.current = () => {
        clearInterval(id);
        source.disconnect();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      setStatus("on");
      return true;
    } catch {
      setStatus("denied");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    levelRef.current = 0;
    setSpeaking(false);
  }, []);

  /** Busy room mode: stricter speech detection. Remembered in this browser. */
  const setBusy = useCallback((b: boolean) => {
    ratioRef.current = b ? 4.5 : 2.8;
    setBusyState(b);
    try {
      localStorage.setItem("tribute-busy-room", b ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("tribute-busy-room") === "1") {
        ratioRef.current = 4.5;
        setBusyState(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => () => stopRef.current?.(), []);

  return { start, stop, status, speaking, busy, setBusy, levelRef, floorRef, thresholdRef, silenceRef };
}