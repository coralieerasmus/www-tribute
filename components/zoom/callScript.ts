/**
 * THE CALL SCRIPT
 * ---------------
 * All recorded lines are cut and joined into ONE video: /public/videos/call.mp4.
 * Below is where each line starts and ends in that video (in seconds).
 *
 * call.mp4 (63 s):
 *   0.0 –  5.8  hello      27.9 – 30.6  old
 *   5.8 – 10.9  how        30.6 – 34.5  muted
 *  10.9 – 17.5  what       34.5 – 52.7  lag (two recordings joined, long pauses shortened)
 *  17.5 – 22.9  stan       52.7 – 59.1  fillers (haha yeah / mm totally / third one)
 *  22.9 – 27.9  phone      59.1 – 63.1  listening loop (no sound, plays forward then backward)
 *
 * How it works:
 *  1. A segment plays from `start` to `end`.
 *  2. If `waitForAnswer` is true, the video pauses and the site listens to the mic.
 *     When the user has talked and then goes quiet, the next segment plays.
 *  3. While waiting, `LISTENING_LOOP` (if set) loops muted, so the person looks
 *     like they're listening instead of frozen. Record ~5 seconds of nodding/smiling.
 *
 * Until the video exists, the site runs in PLACEHOLDER MODE: the `text` of each
 * segment is spoken by the browser's text-to-speech and shown as captions,
 * so you can test the whole flow right now.
 */

export type Segment = {
  id: string;
  /** seconds into the video */
  start?: number;
  end?: number;
  /** what the person says (used for captions + placeholder text-to-speech) */
  text: string;
  waitForAnswer?: boolean;
};

/** Set to null to force placeholder mode. */
export const CALL_VIDEO_SRC: string | null = "/videos/call.mp4";

/** Show captions under the caller even when the real video is used. */
export const ALWAYS_SHOW_CAPTIONS = false;

/** Optional muted "listening" loop inside the same video. */
export const LISTENING_LOOP: { start: number; end: number } | null = { start: 59.133, end: 63.1 };

/**
 * true  = the lag starts right after the user answers the last question (natural flow).
 * false = after the script, FILLERS keep the call going until TIMINGS.callBeforeGlitchMs.
 * Either way the lag starts at TIMINGS.callBeforeGlitchMs at the latest.
 */
export const LAG_AFTER_SCRIPT = true;

/** The scripted conversation, in order. */
export const SEGMENTS: Segment[] = [
  { id: "hello", start: 0, end: 5.8, waitForAnswer: true, text: "Oh hey! You actually picked up. Can you hear me?" },
  { id: "how", start: 5.8, end: 10.867, waitForAnswer: true, text: "Okay good. Sorry for calling out of nowhere. How are you doing?" },
  { id: "what", start: 10.867, end: 17.467, waitForAnswer: true, text: "Nice, nice. So what are you up to right now?" },
  { id: "stan", start: 17.467, end: 22.867, waitForAnswer: true, text: "Oh wait, did you see that new YouTube video Stan put on his status?" },
  { id: "phone", start: 22.867, end: 27.867, waitForAnswer: true, text: "Okay, random question. What phone do you have right now?" },
  { id: "old", start: 27.867, end: 30.6, waitForAnswer: true, text: "Hmm. Is it, like... old?" },
];

/**
 * Only used when LAG_AFTER_SCRIPT is false: short reactions played (in rotation)
 * whenever the user answers after the script has run out.
 */
export const FILLERS: Segment[] = [
  { id: "f1", start: 52.667, end: 54.867, text: "Haha, yeah." },
  { id: "f2", start: 54.867, end: 57.0, text: "Mm, totally." },
  { id: "f3", start: 57.0, end: 59.133, text: "Mhm." },
];

/** Played once if the user is muted while they're supposed to answer. Set start/end or leave text-only. */
export const MUTED_SEGMENT: Segment | null = {
  id: "muted",
  start: 30.6,
  end: 34.467,
  text: "Uh... I think you're on mute?",
};

/** The final clip, played while everything lags. When it ends, the call ends. */
export const LAG_SEGMENT: Segment = {
  id: "lag",
  start: 34.467,
  end: 52.667,
  text: "Wait... you're freezing. Ugh, this call is so laggy. Next time just call me from your phone... oh wait, that thing is ancient too. You really need a new phone! Sorry, I gotta go. Talk later!",
};

/** Voice-detection tuning. */
export const VAD = {
  /** How long the user must talk before it counts as an answer. */
  minSpeechMs: 250,
  /** How long they must be quiet after talking before the next question plays.
   *  Lower = snappier, but people pausing mid-sentence may get cut off. */
  endSilenceMs: 700,
  /** Once they've started talking, move on after this long even if the room never goes quiet. */
  maxAnswerMs: 6_000,
  /** If they say nothing at all, move on after this long anyway. */
  noAnswerTimeoutMs: 7_000,
  /** Same, but when the mic is blocked/unavailable. */
  noMicTimeoutMs: 4_000,
  /** Small pause after the caller finishes before we start listening (avoids echo). */
  listenDelayMs: 250,
};