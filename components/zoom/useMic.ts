"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "@/lib/sounds";

/**
 * Microphone voice detector.
 *
 * - The mic signal is band-passed to the human-voice range (fans, hum and
 *   hiss are mostly ignored).
 * - The background-noise level is tracked continuously, so the detector keeps
 *   adapting to the room instead of calibrating once.
 * - Two thresholds (hysteresis): `thresholdRef` = "this is speech",
 *   `silenceRef` = "this is quiet again". That makes the end of an answer
 *   detectable quickly instead of waiting for background noise to drop.
 *
 * Refs are read every frame without re-rendering; `speaking` is React state for UI.
 */
export function useMic() {
  const levelRef = useRef(0);
  const thresholdRef = useRef(0.03);
  const silenceRef = useRef(0.018);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "on" | "denied">("idle");
  const [speaking, setSpeaking] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const start = useCallback(async () => {
    if (streamRef.current) return true;
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      streamRef.current = stream;
      const ctx = getAudioContext();
      if (!ctx) throw new Error("no audio context");
      await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 120;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 3800;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // ~10ms windows at 48kHz: fast reaction
      source.connect(highpass).connect(lowpass).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      let floor = 0.008;
      let speakingNow = false;
      let lastLoud = 0;

      const id = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);

        // fast attack, quicker release than before so silence is seen sooner
        const prev = levelRef.current;
        levelRef.current = rms > prev ? prev * 0.3 + rms * 0.7 : prev * 0.55 + rms * 0.45;

        // noise floor: drops quickly, rises very slowly (so speech doesn't raise it)
        if (rms < floor) floor = floor * 0.85 + rms * 0.15;
        else floor = floor * 0.9985 + rms * 0.0015;
        floor = Math.max(0.0015, floor);

        thresholdRef.current = Math.min(0.1, Math.max(0.012, floor * 2.8 + 0.006));
        silenceRef.current = Math.min(0.06, Math.max(0.007, floor * 1.7 + 0.003));

        const now = performance.now();
        if (levelRef.current > thresholdRef.current) lastLoud = now;
        const next = now - lastLoud < 200;
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

  useEffect(() => () => stopRef.current?.(), []);

  return { start, stop, status, speaking, levelRef, thresholdRef, silenceRef };
}