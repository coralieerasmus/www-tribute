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

/* ======================================================================
 * Ambient / installation sounds for the ending (after the iPhone store).
 * Slow, deep and spacious: pads, sub-bass, air and a long reverb.
 * ==================================================================== */

let reverbNode: ConvolverNode | null = null;

/** A big, dark hall reverb (impulse response generated on the fly). */
function getReverb(c: AudioContext): ConvolverNode {
  if (reverbNode && reverbNode.context === c) return reverbNode;
  const seconds = 5;
  const len = Math.floor(c.sampleRate * seconds);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      // filtered noise, so the tail gets darker as it decays
      lp += (Math.random() * 2 - 1 - lp) * (0.35 - t * 0.3);
      d[i] = lp * Math.pow(1 - t, 3.2);
    }
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  const ret = c.createGain();
  ret.gain.value = 1.6;
  conv.connect(ret).connect(c.destination);
  reverbNode = conv;
  return conv;
}

/** dry + wet output bus */
function bus(c: AudioContext, wet: number, dry = 1) {
  const input = c.createGain();
  const d = c.createGain();
  d.gain.value = dry;
  const w = c.createGain();
  w.gain.value = wet;
  input.connect(d).connect(c.destination);
  input.connect(w).connect(getReverb(c));
  return input;
}

/** A slowly breathing chord of detuned oscillators. */
function pad(c: AudioContext, out: AudioNode, freqs: number[], at: number) {
  const nodes: OscillatorNode[] = [];
  freqs.forEach((f, i) => {
    for (const det of [-6, 5]) {
      const o = c.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = det;
      const g = c.createGain();
      g.gain.value = (i === 0 ? 0.5 : 0.22) / freqs.length;
      // slow tremolo, different per voice, so it "breathes"
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.07 + i * 0.031 + (det > 0 ? 0.013 : 0);
      const lg = c.createGain();
      lg.gain.value = g.gain.value * 0.45;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(out);
      o.start(at);
      lfo.start(at);
      nodes.push(o, lfo);
    }
  });
  return nodes;
}

function stopAll(nodes: (AudioScheduledSourceNode | null)[], at: number) {
  nodes.forEach((n) => {
    try {
      n?.stop(at);
    } catch {
      /* already stopped */
    }
  });
}

/**
 * The pull-back: a deep chord that slowly opens up while the wall of screens
 * appears, with a low sub underneath and a faint rising air. Returns stop().
 */
export function startSwell(durationMs: number): () => void {
  const c = getAudioContext();
  if (!c) return () => {};
  void c.resume();
  const t = c.currentTime + 0.02;
  const end = t + durationMs / 1000;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.5, end);
  out.connect(bus(c, 0.9, 0.7));

  // D minor (add 9), very low
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.Q.value = 0.7;
  lp.frequency.setValueAtTime(180, t);
  lp.frequency.exponentialRampToValueAtTime(2400, end);
  lp.connect(out);
  const voices = pad(c, lp, [73.42, 110, 146.83, 174.61, 164.81 * 2], t);

  const sub = c.createOscillator();
  sub.frequency.value = 36.71;
  const sg = c.createGain();
  sg.gain.value = 0.35;
  sub.connect(sg).connect(out);
  sub.start(t);

  // air: noise slowly rising in pitch
  const air = c.createBufferSource();
  air.buffer = noiseBuffer(c, 3);
  air.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(400, t);
  bp.frequency.exponentialRampToValueAtTime(3200, end);
  const ag = c.createGain();
  ag.gain.value = 0.05;
  air.connect(bp).connect(ag).connect(out);
  air.start(t);

  const all = [...voices, sub, air];
  return () => {
    const now = c.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.setTargetAtTime(0, now, 0.06);
    stopAll(all, now + 0.6);
    setTimeout(() => out.disconnect(), 900);
  };
}

/**
 * The rupture (when the screens break): a deep sub drop, a dark tearing
 * noise and a few digital stutters, all thrown into the big reverb.
 */
export function playRupture() {
  const c = getAudioContext();
  if (!c) return;
  void c.resume();
  const t = c.currentTime + 0.01;
  const out = bus(c, 1.1, 0.8);

  // sub drop
  const sub = c.createOscillator();
  sub.frequency.setValueAtTime(90, t);
  sub.frequency.exponentialRampToValueAtTime(26, t + 1.6);
  const sg = c.createGain();
  sg.gain.setValueAtTime(0.0001, t);
  sg.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  sub.connect(sg).connect(out);
  sub.start(t);
  sub.stop(t + 1.9);

  // tearing noise, closing down
  const n = c.createBufferSource();
  n.buffer = noiseBuffer(c, 1.4);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(7000, t);
  lp.frequency.exponentialRampToValueAtTime(160, t + 1.2);
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.35, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
  n.connect(lp).connect(ng).connect(out);
  n.start(t);

  // digital stutters: tiny gated blips, getting sparser
  let at = t + 0.12;
  for (let i = 0; i < 9; i++) {
    const b = c.createOscillator();
    b.type = "square";
    b.frequency.value = [1760, 2637, 880, 3520][i % 4];
    const bg = c.createGain();
    const len = 0.012 + Math.random() * 0.02;
    bg.gain.setValueAtTime(0.0001, at);
    bg.gain.linearRampToValueAtTime(0.035, at + 0.002);
    bg.gain.linearRampToValueAtTime(0.0001, at + len);
    b.connect(bg).connect(out);
    b.start(at);
    b.stop(at + len + 0.01);
    at += 0.04 + i * 0.025 + Math.random() * 0.04;
  }

  setTimeout(() => out.disconnect(), 7000);
}

/** Low, quiet electrical hum under the dying screen. Returns stop(). */
export function startHum(volume = 0.05): () => void {
  const c = getAudioContext();
  if (!c) return () => {};
  const t = c.currentTime;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(volume, t + 0.4);
  out.connect(bus(c, 0.5, 1));
  const o = c.createOscillator();
  o.frequency.value = 50;
  const o2 = c.createOscillator();
  o2.frequency.value = 100.4;
  const g2 = c.createGain();
  g2.gain.value = 0.3;
  o.connect(out);
  o2.connect(g2).connect(out);
  o.start(t);
  o2.start(t);
  return () => {
    const now = c.currentTime;
    out.gain.setTargetAtTime(0, now, 0.08);
    stopAll([o, o2], now + 0.6);
    setTimeout(() => out.disconnect(), 800);
  };
}

/** A soft bell in the reverb, used to mark each era in the rewind. */
export function playChime(freq = 440, volume = 0.12) {
  const c = getAudioContext();
  if (!c) return;
  const t = c.currentTime + 0.01;
  const out = bus(c, 1.3, 0.5);
  [1, 2.01, 2.76, 4.07].forEach((ratio, i) => {
    const o = c.createOscillator();
    o.frequency.value = freq * ratio;
    const g = c.createGain();
    const v = volume / (1 + i * 1.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.5 / (1 + i * 0.6));
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 4);
  });
  setTimeout(() => out.disconnect(), 9000);
}

/**
 * Travelling back in time: a wide chord that slowly sinks in pitch (like a
 * tape slowing down), wind that moves past you, a slow deep pulse like a
 * clock, and a long reversed swell into the light at the end. Returns stop().
 */
export function startTimeTravel(durationMs: number): () => void {
  const c = getAudioContext();
  if (!c) return () => {};
  void c.resume();
  const t = c.currentTime + 0.02;
  const dur = durationMs / 1000;
  const end = t + dur;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(0.55, t + 1.2);
  out.connect(bus(c, 1, 0.75));

  // sinking chord
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1800, t);
  lp.frequency.exponentialRampToValueAtTime(700, end - 1.2);
  lp.frequency.exponentialRampToValueAtTime(5000, end);
  lp.connect(out);
  const voices = pad(c, lp, [55, 82.41, 110, 130.81, 196], t) as OscillatorNode[];
  voices.forEach((o) => {
    if (o.frequency.value < 20) return; // that's an LFO
    o.detune.setValueAtTime(o.detune.value, t);
    o.detune.linearRampToValueAtTime(o.detune.value - 500, end - 1.2);
    o.detune.linearRampToValueAtTime(o.detune.value - 480, end);
  });

  // wind rushing past
  const wind = c.createBufferSource();
  wind.buffer = noiseBuffer(c, 4);
  wind.loop = true;
  const wbp = c.createBiquadFilter();
  wbp.type = "bandpass";
  wbp.Q.value = 0.9;
  wbp.frequency.setValueAtTime(900, t);
  wbp.frequency.exponentialRampToValueAtTime(350, end - 1);
  const wg = c.createGain();
  wg.gain.setValueAtTime(0.0001, t);
  wg.gain.exponentialRampToValueAtTime(0.09, t + dur * 0.5);
  wg.gain.exponentialRampToValueAtTime(0.03, end - 1.2);
  wind.connect(wbp).connect(wg).connect(out);
  wind.start(t);

  // slow pulse, like a clock in a big room (gets slower: time winding down)
  const pulses: OscillatorNode[] = [];
  let at = t + 0.4;
  let gap = 0.75;
  while (at < end - 1.4) {
    const p = c.createOscillator();
    p.frequency.setValueAtTime(62, at);
    p.frequency.exponentialRampToValueAtTime(38, at + 0.35);
    const pg = c.createGain();
    pg.gain.setValueAtTime(0.0001, at);
    pg.gain.exponentialRampToValueAtTime(0.4, at + 0.01);
    pg.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    p.connect(pg).connect(out);
    p.start(at);
    p.stop(at + 0.55);
    pulses.push(p);
    at += gap;
    gap *= 1.05;
  }

  // reversed swell into the light
  const sw = c.createBufferSource();
  sw.buffer = noiseBuffer(c, 2.5);
  const shp = c.createBiquadFilter();
  shp.type = "highpass";
  shp.frequency.value = 500;
  const sgn = c.createGain();
  const swStart = end - 1.6;
  sgn.gain.setValueAtTime(0.0001, swStart);
  sgn.gain.exponentialRampToValueAtTime(0.32, end - 0.05);
  sgn.gain.linearRampToValueAtTime(0.0001, end + 0.05);
  sw.connect(shp).connect(sgn).connect(out);
  sw.start(swStart);

  // after the light: a long, clean tone that rings out in the reverb
  const tone = c.createOscillator();
  tone.frequency.value = 880;
  const tg = c.createGain();
  tg.gain.setValueAtTime(0.0001, end - 0.05);
  tg.gain.exponentialRampToValueAtTime(0.05, end);
  tg.gain.exponentialRampToValueAtTime(0.0001, end + 2.5);
  tone.connect(tg).connect(c.destination);
  tone.connect(tg).connect(getReverb(c));
  tone.start(end - 0.05);
  tone.stop(end + 2.6);

  // the chord stops right at the flash; everything else rings out in the reverb
  out.gain.setValueAtTime(0.55, end - 0.05);
  out.gain.exponentialRampToValueAtTime(0.0001, end + 0.25);
  const all = [...voices, wind, sw, ...pulses];
  stopAll(all, end + 0.4);

  return () => {
    const now = c.currentTime;
    if (now >= end - 0.1) return; // let the ending ring out naturally
    out.gain.cancelScheduledValues(now);
    out.gain.setValueAtTime(out.gain.value, now);
    out.gain.setTargetAtTime(0, now, 0.05);
    stopAll([...all, tone], now + 0.4);
  };
}