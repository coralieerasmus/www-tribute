/**
 * The content of the "phone content right now" finale.
 *
 * - `video`  : a real clip in /public/feed (plays on the big phone, with sound)
 * - `stills` : frames from that clip (used on the hundreds of small screens, much lighter than video)
 * - items without a video are drawn as fake shorts (gradient + emoji + captions)
 *
 * To add a clip: drop it in /public/feed, add stills in /public/feed/stills (optional) and add an item here.
 */

export type FeedItem = {
  id: string;
  kind: "brainrot" | "politics";
  user: string;
  caption: string;
  /** big text on the video itself (only for the drawn ones) */
  overlay?: string;
  emoji: string;
  likes: string;
  bg: string;
  video?: string;
  stills?: string[];
};

const stills = (n: number) => [1, 2, 3, 4].map((k) => `/feed/stills/clip${n}-${k}.jpg`);

/** Your real clips. */
export const CLIPS: FeedItem[] = [
  { id: "c1", kind: "brainrot", user: "@pigeon.core", caption: "he's not okay 💀💀", emoji: "🐦", likes: "2.4M", bg: "#222", video: "/feed/clip1.mp4", stills: stills(1) },
  { id: "c2", kind: "brainrot", user: "@pigeon.core", caption: "the dance at 0:07 😭", emoji: "🐦", likes: "1.8M", bg: "#222", video: "/feed/clip2.mp4", stills: stills(2) },
  { id: "c3", kind: "brainrot", user: "@3am.walks", caption: "who let him out at 3am", emoji: "🥖", likes: "960K", bg: "#222", video: "/feed/clip3.mp4", stills: stills(3) },
  { id: "c4", kind: "brainrot", user: "@mall.cam", caption: "nobody asked him to do this", emoji: "🛞", likes: "3.1M", bg: "#222", video: "/feed/clip4.mp4", stills: stills(4) },
  { id: "c5", kind: "brainrot", user: "@cat.lore", caption: "the lore goes so deep ⚡", emoji: "🐈", likes: "1.2M", bg: "#222", video: "/feed/clip5.mp4", stills: stills(5) },
  { id: "c6", kind: "brainrot", user: "@infinite.loop", caption: "WAIT FOR IT", emoji: "😐", likes: "4.0M", bg: "#222", video: "/feed/clip6.mp4", stills: stills(6) },
  { id: "c7", kind: "brainrot", user: "@edit.overload", caption: "edit so hard my phone got hot 🔥", emoji: "🔥", likes: "720K", bg: "#222", video: "/feed/clip7.mp4", stills: stills(7) },
];

/** Drawn items (politics + extra brainrot) mixed in between the clips. */
const DRAWN: FeedItem[] = [
  { id: "p1", kind: "politics", user: "@breaking.now", caption: "debate gets HEATED live on air", overlay: "BREAKING", emoji: "🎤", likes: "402K", bg: "linear-gradient(180deg,#0b1d51,#14213d 60%,#c1121f)" },
  { id: "p2", kind: "politics", user: "@hot.takes.24", caption: "you won't BELIEVE what was said in parliament", overlay: "?!?!", emoji: "🏛️", likes: "88K", bg: "linear-gradient(170deg,#1f1f1f,#3a0ca3 70%)" },
  { id: "b2", kind: "brainrot", user: "@italian.brainrot", caption: "tralalero tralala 🦈👟", overlay: "TRALALERO", emoji: "🦈", likes: "3.4M", bg: "linear-gradient(160deg,#00c6ff,#0072ff)" },
  { id: "p3", kind: "politics", user: "@election.live", caption: "Election results LIVE: it's closer than ever", overlay: "LIVE", emoji: "🗳️", likes: "1.1M", bg: "linear-gradient(180deg,#003049,#d62828)" },
  { id: "p4", kind: "politics", user: "@the.real.facts", caption: "Is THIS the end of democracy?? 🤔", overlay: "THE TRUTH", emoji: "📢", likes: "230K", bg: "linear-gradient(180deg,#370617,#9d0208 50%,#f48c06)" },
  { id: "b4", kind: "brainrot", user: "@sigma.grind", caption: "5AM sigma routine (no talking)", overlay: "SIGMA", emoji: "🗿", likes: "640K", bg: "linear-gradient(160deg,#232526,#414345)" },
  { id: "p5", kind: "politics", user: "@protest.cam", caption: "thousands on the streets right now", overlay: "RIGHT NOW", emoji: "🪧", likes: "512K", bg: "linear-gradient(180deg,#2b2d42,#8d99ae)" },
  { id: "p6", kind: "politics", user: "@news.in.60", caption: "new law explained in 60 seconds", overlay: "60 SEC", emoji: "⚖️", likes: "95K", bg: "linear-gradient(180deg,#0f2027,#2c5364)" },
  { id: "p7", kind: "politics", user: "@clip.that", caption: "candidate walks off stage mid-interview", overlay: "CAUGHT ON CAMERA", emoji: "🎥", likes: "1.4M", bg: "linear-gradient(180deg,#141e30,#243b55)" },
  { id: "b9", kind: "brainrot", user: "@rizz.academy", caption: "unspoken rizz level 1000", overlay: "W RIZZ", emoji: "😏", likes: "2.7M", bg: "linear-gradient(160deg,#ff512f,#dd2476)" },
  { id: "p8", kind: "politics", user: "@world.update", caption: "summit ends without a deal. what now?", overlay: "UPDATE", emoji: "🌍", likes: "61K", bg: "linear-gradient(180deg,#1d3557,#457b9d)" },
];

/** Clips and drawn items interleaved: clip, drawn, clip, drawn, … */
export const FEED: FeedItem[] = (() => {
  const out: FeedItem[] = [];
  const n = Math.max(CLIPS.length, DRAWN.length);
  for (let i = 0; i < n; i++) {
    if (CLIPS[i]) out.push(CLIPS[i]);
    if (DRAWN[i]) out.push(DRAWN[i]);
  }
  return out;
})();

/** Six items for one screen, starting at `offset` (used by every tile and the CSS phone). */
export function feedStrip(offset: number): FeedItem[] {
  const out: FeedItem[] = [];
  for (let i = 0; i < 6; i++) out.push(FEED[(offset + i * 3) % FEED.length]);
  return out;
}

/** All stills, for the rewind tunnel. */
export const ALL_STILLS: string[] = CLIPS.flatMap((c) => c.stills ?? []);