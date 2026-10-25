"use client";

/**
 * Tiny Web Audio sound kit. Everything is synthesised so the project works
 * without any audio files. Browsers only allow audio after a user gesture,
 * so call `unlockAudio()` from a click/keydown handler early on.
 */

let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function unlockAudio() {
  const c = getAudioContext();
  if (c && c.state === "suspended") void c.resume();
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function pluck(c: AudioContext, out: AudioNode, freq: number, at: number, dur = 0.5, vol = 0.25) {
  const osc = c.createOscillator();
  const osc2 = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc2.type = "triangle";
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(vol, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  const g2 = c.createGain();
  g2.gain.value = 0.15;
  osc.connect(gain);
  osc2.connect(g2).connect(gain);
  gain.connect(out);
  osc.start(at);
  osc2.start(at);
  osc.stop(at + dur + 0.05);
  osc2.stop(at + dur + 0.05);
}

/**
 * Plays an incoming-call ringtone on loop. Tries `fileSrc` first and falls
 * back to a synthesised marimba-style ring. Returns a stop function.
 */
export function startRingtone(fileSrc?: string): () => void {
  let stopped = false;
  let interval: ReturnType<typeof setInterval> | null = null;
  let audioEl: HTMLAudioElement | null = null;
  let master: GainNode | null = null;

  const startSynth = () => {
    if (stopped) return;
    const c = getAudioContext();
    if (!c) return;
    void c.resume();
    master = c.createGain();
    master.gain.value = 0.9;
    master.connect(c.destination);
    const notes = [659.25, 830.61, 987.77, 1318.51, 987.77, 830.61];
    const ringOnce = () => {
      if (!master) return;
      const t = c.currentTime + 0.05;
      notes.forEach((f, i) => pluck(c, master!, f, t + i * 0.13, 0.45));
      notes.forEach((f, i) => pluck(c, master!, f, t + 1.0 + i * 0.13, 0.45));
    };
    ringOnce();
    interval = setInterval(ringOnce, 3200);
  };

  if (fileSrc) {
    audioEl = new Audio(fileSrc);
    audioEl.loop = true;
    audioEl.play().catch(() => {
      audioEl = null;
      startSynth();
    });
  } else {
    startSynth();
  }

  return () => {
    stopped = true;
    if (interval) clearInterval(interval);
    if (audioEl) {
      audioEl.pause();
      audioEl.src = "";
    }
    if (master) {
      const c = getAudioContext();
      if (c) master.gain.setTargetAtTime(0, c.currentTime, 0.03);
      const m = master;
      setTimeout(() => m.disconnect(), 300);
    }
  };
}

/** A glass-shatter impact: thump + crunchy noise burst + tinkling shards. */
export function playShatter() {
  const c = getAudioContext();
  if (!c) return;
  void c.resume();
  const t = c.currentTime + 0.02;
  const out = c.createGain();
  out.gain.value = 0.9;
  out.connect(c.destination);

  // low thump
  const thump = c.createOscillator();
  const tg = c.createGain();
  thump.frequency.setValueAtTime(140, t);
  thump.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  tg.gain.setValueAtTime(0.9, t);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  thump.connect(tg).connect(out);
  thump.start(t);
  thump.stop(t + 0.35);

  // crunch
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, 1.2);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.8, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  n.connect(hp).connect(ng).connect(out);
  n.start(t);

  // shards
  for (let i = 0; i < 26; i++) {
    const at = t + 0.03 + Math.random() * 0.9;
    pluck(c, out, 2500 + Math.random() * 5000, at, 0.08 + Math.random() * 0.25, 0.05 + Math.random() * 0.08);
  }
}

/** Electrical buzz / broken-panel hum with random crackles. Returns stop(). */
export function startBuzz(volume = 0.12): () => void {
  const c = getAudioContext();
  if (!c) return () => {};
  void c.resume();
  const out = c.createGain();
  out.gain.value = volume;
  out.connect(c.destination);

  const hum = c.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 50;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  const hg = c.createGain();
  hg.gain.value = 0.5;
  hum.connect(lp).connect(hg).connect(out);
  hum.start();

  const crackle = setInterval(() => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.06 + Math.random() * 0.15);
    const g = c.createGain();
    g.gain.value = 0.3 + Math.random() * 0.7;
    src.connect(g).connect(out);
    src.start();
    hg.gain.setTargetAtTime(Math.random() * 0.9, c.currentTime, 0.02);
  }, 90 + Math.random() * 120);

  return () => {
    clearInterval(crackle);
    out.gain.setTargetAtTime(0, c.currentTime, 0.02);
    setTimeout(() => {
      hum.stop();
      out.disconnect();
    }, 200);
  };
}

/** VHS tape rewinding: a rising whine + hiss + wobble. Returns stop(). */
export function startRewind(durationMs: number): () => void {
  const c = getAudioContext();
  if (!c) return () => {};
  void c.resume();
  const t = c.currentTime;
  const end = t + durationMs / 1000;
  const out = c.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(0.16, t + 0.3);
  out.gain.setValueAtTime(0.16, end - 0.4);
  out.gain.linearRampToValueAtTime(0, end);
  out.connect(c.destination);

  const whine = c.createOscillator();
  whine.type = "sawtooth";
  whine.frequency.setValueAtTime(180, t);
  whine.frequency.exponentialRampToValueAtTime(1400, end);
  const wobble = c.createOscillator();
  wobble.frequency.value = 7;
  const wobbleGain = c.createGain();
  wobbleGain.gain.value = 30;
  wobble.connect(wobbleGain).connect(whine.frequency);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2200;
  const wg = c.createGain();
  wg.gain.value = 0.35;
  whine.connect(lp).connect(wg).connect(out);

  const hiss = c.createBufferSource();
  hiss.buffer = noiseBuffer(c, 2);
  hiss.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3500;
  bp.Q.value = 0.6;
  const hg = c.createGain();
  hg.gain.value = 0.5;
  hiss.connect(bp).connect(hg).connect(out);

  whine.start(t);
  wobble.start(t);
  hiss.start(t);
  const stopAt = end + 0.05;
  whine.stop(stopAt);
  wobble.stop(stopAt);
  hiss.stop(stopAt);

  return () => {
    const now = c.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setTargetAtTime(0, now, 0.03);
    setTimeout(() => {
      try {
        whine.stop();
        wobble.stop();
        hiss.stop();
      } catch {
        /* already stopped */
      }
      out.disconnect();
    }, 200);
  };
}

/** Short digital "chirp" used for lag dropouts in the call. */
export function playDropout() {
  const c = getAudioContext();
  if (!c) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.12);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900 + Math.random() * 2000;
  bp.Q.value = 6;
  const g = c.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  src.connect(bp).connect(g).connect(c.destination);
  src.start(t);
}