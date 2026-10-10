/**
 * Central config for the whole "www tribute" journey.
 * Tweak timings, names and routes here instead of digging through components.
 */

export const ROUTES = {
  landing: "/", // made by your duo partner
  youtube: "/youtube",
  call: "/call",
  google: "/google",
  googleSearch: "/google/search",
  apple: "/apple",
} as const;

export const TIMINGS = {
  /** How long the user is on the YouTube page before the Zoom call comes in. */
  youtubeBeforeCallMs: 60_000,
  /** How long the "haha u thought" text stays before the call opens. */
  declineJokeMs: 1_800,
  /** How long into the call before everything starts lagging. */
  callBeforeGlitchMs: 90_000,
  /** How long it lags before the "get a new laptop" clip interrupts. */
  glitchLeadMs: 5_000,
  /** Time the "meeting ended" message stays before going to Google. */
  callEndedMs: 3_000,
  /** How long the user is on the Apple page before the screen breaks. */
  appleBeforeBreakMs: 30_000,
  /** How long the screen break lasts before going back to the landing page. */
  screenBreakMs: 7_000,
} as const;

/** The person "calling" the user. Used in the invite popup and the call. */
export const CALLER = {
  name: "Jenni",
  roomName: "Jenni’s Personal Meeting Room",
} as const;

/** Label on the user's own tile in the call. */
export const USER_LABEL = "You";

/**
 * Optional brand images (export them from your Figma designs and put them in /public/brand).
 * If a file is missing, a plain text fallback is shown instead.
 */
export const BRAND = {
  youtubeLogo: "/brand/youtube-logo.png",
  googleLogo: "/brand/google-doodle.png", // small logo on the results page
  googleDoodle: "/brand/google-doodle.png",
  appleLogo: "/brand/apple-logo.png",
  zoomLogo: "/brand/zoom-logo.svg",
} as const;

/** Optional sound files. If missing, the sounds are synthesised in the browser. */
export const SOUNDS = {
  ring: "/sounds/zoom-ring.mp3",
} as const;