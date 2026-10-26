/**
 * The content of the "phone content right now" finale.
 *
 * - `video`  : a real clip in /public/feed (plays on the big phone, with sound)
 * - `stills` : frames from that clip (used on the hundreds of small screens, much lighter than video)
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
  { id: "c8", kind: "brainrot", user: "@cupcake.heaven", caption: "carrot cat has ascended 😇", emoji: "🥕", likes: "1.6M", bg: "#222", video: "/feed/clip8.mp4", stills: stills(8) },
  { id: "c9", kind: "brainrot", user: "@spooky.szn", caption: "halloween is coming 🎃", emoji: "🎃", likes: "890K", bg: "#222", video: "/feed/clip9.mp4", stills: stills(9) },
  { id: "c10", kind: "brainrot", user: "@cupcake.cats", caption: "don't let it ruin your day 🧁", emoji: "🧁", likes: "2.2M", bg: "#222", video: "/feed/clip10.mp4", stills: stills(10) },
  { id: "c11", kind: "brainrot", user: "@bathroom.art", caption: "#hopecore 🥹", emoji: "🥹", likes: "540K", bg: "#222", video: "/feed/clip11.mp4", stills: stills(11) },
  { id: "c12", kind: "brainrot", user: "@peak.tiktok", caption: "caught bro washing cars 😭", emoji: "😭", likes: "3.3M", bg: "#222", video: "/feed/clip12.mp4", stills: stills(12) },
  { id: "c13", kind: "brainrot", user: "@office.chaos", caption: "when the teacher leaves the room 💀", emoji: "💀", likes: "4.7M", bg: "#222", video: "/feed/clip13.mp4", stills: stills(13) },
];

/** Every screen in the finale plays only your clips. Add more to CLIPS above to get more variety. */
export const FEED: FeedItem[] = CLIPS;

/** Six items for one screen, starting at `offset` (used by every tile and the CSS phone). */
export function feedStrip(offset: number): FeedItem[] {
  const out: FeedItem[] = [];
  for (let i = 0; i < 6; i++) out.push(FEED[(offset + i * 3) % FEED.length]);
  return out;
}

/** All stills, for the rewind tunnel. */
export const ALL_STILLS: string[] = CLIPS.flatMap((c) => c.stills ?? []);