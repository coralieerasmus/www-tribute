/**
 * The content of the "phone content right now" finale.
 *
 * Every item is drawn as a fake short-form video (gradient + emoji + captions),
 * so it works without any files. To use REAL clips, put vertical videos in
 * /public/feed/ and add `video: "/feed/clip1.mp4"` to an item. Clips are
 * muted, looped and only loaded in the big phone + the first tiles of the wall.
 */

export type FeedItem = {
  id: string;
  kind: "brainrot" | "politics";
  user: string;
  caption: string;
  /** big text on the video itself */
  overlay?: string;
  emoji: string;
  likes: string;
  bg: string;
  video?: string;
};

export const FEED: FeedItem[] = [
  { id: "b1", kind: "brainrot", user: "@skibidi.daily", caption: "episode 847 is actually insane 😭", overlay: "WAIT FOR IT", emoji: "🚽", likes: "1.2M", bg: "linear-gradient(160deg,#ff3cac,#784ba0 50%,#2b86c5)" },
  { id: "p1", kind: "politics", user: "@breaking.now", caption: "debate gets HEATED live on air", overlay: "BREAKING", emoji: "🎤", likes: "402K", bg: "linear-gradient(180deg,#0b1d51,#14213d 60%,#c1121f)" },
  { id: "b2", kind: "brainrot", user: "@italian.brainrot", caption: "tralalero tralala 🦈👟", overlay: "TRALALERO", emoji: "🦈", likes: "3.4M", bg: "linear-gradient(160deg,#00c6ff,#0072ff)" },
  { id: "p2", kind: "politics", user: "@hot.takes.24", caption: "you won't BELIEVE what was said in parliament", overlay: "?!?!", emoji: "🏛️", likes: "88K", bg: "linear-gradient(170deg,#1f1f1f,#3a0ca3 70%)" },
  { id: "b3", kind: "brainrot", user: "@subway.stories", caption: "reddit story + subway surfers part 12", overlay: "AITA??", emoji: "🛹", likes: "910K", bg: "linear-gradient(160deg,#f7971e,#ffd200)" },
  { id: "p3", kind: "politics", user: "@election.live", caption: "Election results LIVE: it's closer than ever", overlay: "LIVE", emoji: "🗳️", likes: "1.1M", bg: "linear-gradient(180deg,#003049,#d62828)" },
  { id: "b4", kind: "brainrot", user: "@sigma.grind", caption: "5AM sigma routine (no talking)", overlay: "SIGMA", emoji: "🗿", likes: "640K", bg: "linear-gradient(160deg,#232526,#414345)" },
  { id: "p4", kind: "politics", user: "@the.real.facts", caption: "Is THIS the end of democracy?? 🤔", overlay: "THE TRUTH", emoji: "📢", likes: "230K", bg: "linear-gradient(180deg,#370617,#9d0208 50%,#f48c06)" },
  { id: "b5", kind: "brainrot", user: "@ohio.moments", caption: "only in ohio 💀💀", overlay: "OHIO", emoji: "🌽", likes: "2.2M", bg: "linear-gradient(160deg,#11998e,#38ef7d)" },
  { id: "p5", kind: "politics", user: "@protest.cam", caption: "thousands on the streets right now", overlay: "RIGHT NOW", emoji: "🪧", likes: "512K", bg: "linear-gradient(180deg,#2b2d42,#8d99ae)" },
  { id: "b6", kind: "brainrot", user: "@fanum.tax", caption: "fanum tax on my fries 😤", overlay: "NOT THE FRIES", emoji: "🍟", likes: "780K", bg: "linear-gradient(160deg,#fc4a1a,#f7b733)" },
  { id: "p6", kind: "politics", user: "@news.in.60", caption: "new law explained in 60 seconds", overlay: "60 SEC", emoji: "⚖️", likes: "95K", bg: "linear-gradient(180deg,#0f2027,#2c5364)" },
  { id: "b7", kind: "brainrot", user: "@mewing.coach", caption: "mewing tutorial day 93", overlay: "🤫🧏", emoji: "🧏", likes: "1.9M", bg: "linear-gradient(160deg,#8e2de2,#4a00e0)" },
  { id: "p7", kind: "politics", user: "@clip.that", caption: "candidate walks off stage mid-interview", overlay: "CAUGHT ON CAMERA", emoji: "🎥", likes: "1.4M", bg: "linear-gradient(180deg,#141e30,#243b55)" },
  { id: "b8", kind: "brainrot", user: "@pov.main.character", caption: "POV: you're the main character", overlay: "POV", emoji: "✨", likes: "3.1M", bg: "linear-gradient(160deg,#ee9ca7,#ffdde1)" },
  { id: "p8", kind: "politics", user: "@world.update", caption: "summit ends without a deal. what now?", overlay: "UPDATE", emoji: "🌍", likes: "61K", bg: "linear-gradient(180deg,#1d3557,#457b9d)" },
  { id: "b9", kind: "brainrot", user: "@rizz.academy", caption: "unspoken rizz level 1000", overlay: "W RIZZ", emoji: "😏", likes: "2.7M", bg: "linear-gradient(160deg,#ff512f,#dd2476)" },
  { id: "b10", kind: "brainrot", user: "@npc.live", caption: "NPC stream gone wrong (ice cream so good)", overlay: "GANG GANG", emoji: "🍦", likes: "1.0M", bg: "linear-gradient(160deg,#a8ff78,#78ffd6)" },
];

/** Six items for one screen, starting at `offset` (used by every tile and the phone). */
export function feedStrip(offset: number): FeedItem[] {
  const out: FeedItem[] = [];
  for (let i = 0; i < 6; i++) out.push(FEED[(offset + i * 3) % FEED.length]);
  return out;
}