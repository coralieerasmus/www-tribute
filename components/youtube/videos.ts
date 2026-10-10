/**
 * Videos on the 2010s YouTube page.
 *
 * Each video plays either:
 *  - from YouTube (`youtubeId`) through the official embed API, or
 *  - from your own file (`src`, e.g. "/videos/my-clip.mp4" in /public/videos).
 * If both are set, `src` wins. Thumbnails default to YouTube's own thumbnail;
 * set `thumbnail` to use your own image.
 */

export type Comment = {
  id: string;
  author: string;
  avatarColor: string;
  time: string;
  text: string;
  likes: number;
  replies?: Comment[];
};

export type Video = {
  id: string;
  youtubeId?: string;
  src?: string;
  thumbnail?: string;
  title: string;
  channel: string;
  subscribers: number;
  views: number;
  likes: number;
  dislikes: number;
  duration: string;
  published: string;
  description: string;
  comments: Comment[];
};

export function thumbnailFor(v: Video) {
  if (v.thumbnail) return v.thumbnail;
  if (v.youtubeId) return `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  return "";
}

const c = (
  id: string,
  author: string,
  avatarColor: string,
  time: string,
  text: string,
  likes: number,
  replies?: Comment[],
): Comment => ({ id, author, avatarColor, time, text, likes, replies });

export const VIDEOS: Video[] = [
  {
    id: "rick",
    youtubeId: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Video)",
    channel: "Rick Astley",
    subscribers: 80895,
    views: 138564168,
    likes: 1244701,
    dislikes: 81638,
    duration: "3:33",
    published: "Oct 24, 2009",
    description:
      "Music video by Rick Astley performing Never Gonna Give You Up.\n\nYou know the rules, and so do I.\n\n#RickAstley #NeverGonnaGiveYouUp",
    comments: [
      c("r1", "xXDarkPhoenixXx", "#c0392b", "2 years ago", "who else got rickrolled and decided to stay anyway", 4821, [
        c("r1a", "gamerdude2004", "#2980b9", "2 years ago", "me. no regrets", 312),
      ]),
      c("r2", "MusicLover1987", "#8e44ad", "3 years ago", "81,638 people were never gonna give this a like", 2390),
      c("r3", "skaterboi_99", "#16a085", "1 year ago", "my teacher played this in class today lol", 845),
      c("r4", "Kelsey M", "#d35400", "11 months ago", "this song is better than anything on the radio rn", 501),
      c("r5", "TheRealPotatoKing", "#27ae60", "5 months ago", "thumbs up if you're watching in 2013 👍", 1203),
    ],
  },
  {
    id: "wrecking",
    youtubeId: "My2FRPA3Gf8",
    title: "Miley Cyrus - Wrecking Ball (Official Video)",
    channel: "MileyCyrusVEVO",
    subscribers: 6120334,
    views: 412558901,
    likes: 1902445,
    dislikes: 690112,
    duration: "3:42",
    published: "Sep 9, 2013",
    description: "Music video by Miley Cyrus performing Wrecking Ball. (C) 2013 RCA Records",
    comments: [
      c("w1", "hannahfan_4ever", "#e84393", "1 week ago", "i miss hannah montana honestly", 9921),
      c("w2", "construction_steve", "#0984e3", "3 days ago", "as a wrecking ball operator this is NOT how you use it", 15603),
      c("w3", "lil_bri", "#6c5ce7", "2 days ago", "came in like a wrecking ball and left my replay button broken", 732),
    ],
  },
  {
    id: "orange",
    youtubeId: "XpdU5g9pA-g",
    title: "The Annoying Orange: Hey Apple!",
    channel: "realannoyingorange",
    subscribers: 2394011,
    views: 189224510,
    likes: 512330,
    dislikes: 98120,
    duration: "1:52",
    published: "Oct 9, 2009",
    description: "Hey Apple! Hey Apple! HEY APPLE! 🍊",
    comments: [
      c("o1", "fruitninja_master", "#fdcb6e", "4 years ago", "KNIFE!!!!!", 22009),
      c("o2", "Mr. Grapefruit", "#e17055", "4 years ago", "the ending got me every time", 3410),
      c("o3", "ZackAttack11", "#00b894", "2 years ago", "hey apple. hey apple. hey apple.", 891),
    ],
  },
  {
    id: "chocolate",
    youtubeId: "EwTZ2xpQwpA",
    title: "\"Chocolate Rain\" Original Song by Tay Zonday",
    channel: "TayZonday",
    subscribers: 1084220,
    views: 112850332,
    likes: 640210,
    dislikes: 52331,
    duration: "4:51",
    published: "Apr 22, 2007",
    description: "Chocolate Rain\n\n*I move away from the mic to breathe in.",
    comments: [
      c("c1", "breathe_in_mic", "#6d4c41", "5 years ago", "*moves away from the mic to type this comment*", 12844),
      c("c2", "lowvoicegang", "#636e72", "4 years ago", "his voice is deeper than my thoughts", 4300),
    ],
  },
  {
    id: "harlem",
    youtubeId: "4hpEnLtqUDg",
    title: "Harlem Shake (Original Army Edition)",
    channel: "XOTIC MATTR",
    subscribers: 210443,
    views: 61002331,
    likes: 410992,
    dislikes: 40011,
    duration: "0:31",
    published: "Feb 4, 2013",
    description: "Do the Harlem Shake.",
    comments: [
      c("h1", "helmet_guy_fanclub", "#2d3436", "8 months ago", "the guy in the helmet in the beginning is the real hero", 7210),
      c("h2", "smurfette_irl", "#74b9ff", "6 months ago", "0:15 when the bass drops and so does my homework", 2111),
    ],
  },
  {
    id: "gangnam",
    youtubeId: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE (강남스타일) M/V",
    channel: "officialpsy",
    subscribers: 7700321,
    views: 1902331007,
    likes: 9022331,
    dislikes: 1102330,
    duration: "4:13",
    published: "Jul 15, 2012",
    description: "PSY - GANGNAM STYLE (강남스타일) M/V",
    comments: [
      c("g1", "viewcount_watcher", "#fd79a8", "1 month ago", "almost 2 billion views. youtube's view counter is sweating", 30122),
      c("g2", "horse_dance_pro", "#00cec9", "2 weeks ago", "i have done this dance at 4 weddings this year", 1803),
    ],
  },
  {
    id: "charlie",
    youtubeId: "_OBlgSz8sSM",
    title: "Charlie bit my finger - again !",
    channel: "HDCYT",
    subscribers: 402119,
    views: 650221930,
    likes: 1302221,
    dislikes: 230112,
    duration: "0:56",
    published: "May 22, 2007",
    description: "Even had I planned it, there's no way I could have caught this on camera.",
    comments: [
      c("ch1", "older_sibling_club", "#a29bfe", "3 years ago", "OUCH CHARLIE. OUCH. that really hurt", 18900),
      c("ch2", "baby_whisperer", "#55efc4", "1 year ago", "charlie is a legend and he doesn't even know it", 2201),
    ],
  },
  {
    id: "keyboardcat",
    youtubeId: "J---aiyznGQ",
    title: "Keyboard Cat! - THE ORIGINAL!",
    channel: "Keyboard Cat!",
    subscribers: 302113,
    views: 54021992,
    likes: 300221,
    dislikes: 9102,
    duration: "0:54",
    published: "Jun 7, 2007",
    description: "Play him off, keyboard cat.",
    comments: [
      c("k1", "piano_teacher_2008", "#81ecec", "4 years ago", "better technique than my students", 4410),
      c("k2", "catsofthe2000s", "#ffeaa7", "2 years ago", "play him off, keyboard cat 🎹🐱", 3002),
    ],
  },
];
