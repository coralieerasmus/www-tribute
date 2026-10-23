/**
 * THE CALL SCRIPT
 * ---------------
 * Record ONE video of the person on the call (put it in /public/videos/call.mp4)
 * and fill in where each line starts and ends (in seconds).
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
export const LISTENING_LOOP: { start: number; end: number } | null = null;

/**
 * true  = the lag starts right after the user answers the last question (natural flow).
 * false = after the script, FILLERS keep the call going until TIMINGS.callBeforeGlitchMs.
 * Either way the lag starts at TIMINGS.callBeforeGlitchMs at the latest.
 */
export const LAG_AFTER_SCRIPT = true;

/** The scripted conversation, in order. Times are examples — replace them. */
export const SEGMENTS: Segment[] = [
  { id: "hello", start: 0, end: 4, waitForAnswer: true, text: "Oh hey! You actually picked up. Can you hear me?" },
  { id: "how", start: 4, end: 9, waitForAnswer: true, text: "Okay good. Sorry for calling out of nowhere. How are you doing?" },
  { id: "what", start: 9, end: 13, waitForAnswer: true, text: "Nice, nice. So what are you up to right now?" },
  { id: "stan", start: 13, end: 18, waitForAnswer: true, text: "Oh wait, did you see that new YouTube video Stan put on his status?" },
  { id: "phone", start: 18, end: 23, waitForAnswer: true, text: "Okay, random question. What phone do you have right now?" },
  { id: "old", start: 23, end: 27, waitForAnswer: true, text: "Hmm. Is it, like... old?" },
];

/**
 * Only used when LAG_AFTER_SCRIPT is false: short reactions played (in rotation)
 * whenever the user answers after the script has run out.
 */
export const FILLERS: Segment[] = [
  { id: "f1", start: 27, end: 29, text: "Haha, yeah." },
  { id: "f2", start: 29, end: 31, text: "Mhm, totally." },
  { id: "f3", start: 31, end: 33, text: "Wait, really?" },
];

/** Played once if the user is muted while they're supposed to answer. Set start/end or leave text-only. */
export const MUTED_SEGMENT: Segment | null = {
  id: "muted",
  start: 33,
  end: 36,
  text: "Uh... I think you're on mute?",
};

/** The final clip, played while everything lags. When it ends, the call ends. */
export const LAG_SEGMENT: Segment = {
  id: "lag",
  start: 36,
  end: 44,
  text: "Wait... you're freezing. Damn, holy lag! You should really get a new phone. Oh sorry, I gotta go. Talk to you later!",
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