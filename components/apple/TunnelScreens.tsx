"use client";
/* eslint-disable @next/next/no-img-element */

import type { ReactNode } from "react";
import { ALL_STILLS } from "./feed";
import styles from "./tunnelScreens.module.css";

/**
 * What's on the screens in the rewind tunnel: a different internet trend on
 * (almost) every screen, matching its era. Everything is drawn in CSS, except
 * the 2026 phones (stills of your clips) and the 2012 YouTube screens
 * (thumbnails of the videos on your YouTube page).
 *
 * To add a trend: write a small component below and add it to its era's list.
 */

export type TunnelEra = "now" | "call" | "yt" | "msn" | "web";
type Ctx = { seed: number; img?: string };
type Variant = (c: Ctx) => ReactNode;

const pick = <T,>(arr: T[], seed: number) => arr[seed % arr.length];
const still = (seed: number) => ALL_STILLS[(seed * 7) % ALL_STILLS.length];

/* ======================= 2026 — the feed (phones) ======================= */

const NowStill: Variant = ({ seed }) => <img src={still(seed)} alt="" decoding="async" />;

const NowLive: Variant = ({ seed }) => (
  <div className={styles.fill}>
    <img src={still(seed + 3)} alt="" decoding="async" />
    <span className={styles.liveChip}>● LIVE · {(seed % 90) + 3}.{seed % 10}K</span>
    <span className={styles.liveHearts}>❤️ 💜 ❤️</span>
    <span className={styles.liveGift}>🎁 sent a Galaxy</span>
  </div>
);

const NowPov: Variant = ({ seed }) => (
  <div className={styles.pov} style={{ background: pick(["linear-gradient(160deg,#2b1055,#7597de)", "linear-gradient(160deg,#141e30,#243b55)", "linear-gradient(160deg,#42275a,#734b6d)"], seed) }}>
    <p>{pick(["POV: it's 3am and you're still scrolling", "POV: you said “one more video”", "POV: your screen time report just came in"], seed)}</p>
    <span>#fyp</span>
  </div>
);

const NowSplit: Variant = ({ seed }) => (
  <div className={styles.split}>
    <img src={still(seed + 11)} alt="" decoding="async" />
    <div className={styles.runner}>
      <i />
      <b />
    </div>
  </div>
);

const NowAI: Variant = ({ seed }) => (
  <div className={styles.aiChat}>
    <p className={styles.aiMe}>make a video of a cat that is also a cupcake</p>
    <p className={styles.aiBot}>Here you go ✨</p>
    <img src={still(seed + 5)} alt="" decoding="async" />
    <span className={styles.aiTag}>AI-generated</span>
  </div>
);

const NowSixSeven: Variant = () => (
  <div className={styles.sixSeven}>
    <b>6</b>
    <b>7</b>
    <span>🤲</span>
  </div>
);

const NOW: Variant[] = [NowStill, NowStill, NowLive, NowStill, NowPov, NowStill, NowSplit, NowStill, NowAI, NowStill, NowSixSeven];

/* ======================= 2020 — lockdown (laptops) ======================= */

const NAMES = ["Sam", "Noor", "Jenni", "Daan", "Lisa", "Milan", "Emma", "Yara", "Mum", "Opa Kees"];

const CallGrid: Variant = ({ seed }) => (
  <div className={styles.grid}>
    {[0, 1, 2, 3].map((i) => {
      const name = NAMES[(seed + i) % NAMES.length];
      return (
        <div key={i} style={{ background: `hsl(${(seed * 47 + i * 70) % 360} 18% 26%)` }}>
          <b>{name[0]}</b>
          <span>{name}</span>
          {i === seed % 4 && seed % 3 === 0 && <em>You’re on mute</em>}
        </div>
      );
    })}
  </div>
);

const Dalgona: Variant = () => (
  <div className={styles.recipe}>
    <div className={styles.dalgonaCup}>
      <i />
      <b />
    </div>
    <div>
      <h6>Dalgona coffee ☕</h6>
      <p>only 3 ingredients!!</p>
      <p>whisk 400 times</p>
    </div>
  </div>
);

const Sourdough: Variant = ({ seed }) => (
  <div className={styles.insta}>
    <div className={styles.instaHead}>
      <i /> <span>baking.at.home</span>
    </div>
    <div className={styles.bread}>
      <i />
    </div>
    <p>Day {14 + (seed % 40)} of lockdown. my sourdough starter is called Bob 🍞</p>
  </div>
);

const Curve: Variant = () => (
  <div className={styles.news}>
    <h6>#FlattenTheCurve</h6>
    <svg viewBox="0 0 100 50" preserveAspectRatio="none">
      <path d="M0 48 C 25 48, 32 4, 42 4 S 58 48, 80 48 L100 48" fill="rgba(230,60,60,.35)" stroke="#e63c3c" strokeWidth="1.2" />
      <path d="M0 48 C 30 48, 40 30, 55 30 S 80 48, 100 48" fill="rgba(60,140,230,.35)" stroke="#3c8ce6" strokeWidth="1.2" />
      <line x1="0" y1="26" x2="100" y2="26" stroke="#fff" strokeDasharray="2 2" strokeWidth=".6" />
    </svg>
    <span>STAY HOME · SAVE LIVES</span>
  </div>
);

const TigerKing: Variant = () => (
  <div className={styles.stream}>
    <span className={styles.streamTag}>DOCUSERIES</span>
    <h6>Tiger King</h6>
    <p>Murder, Mayhem and Madness</p>
    <div className={styles.streamBar}>
      <i />
    </div>
  </div>
);

const TikTokDance: Variant = ({ seed }) => (
  <div className={styles.dance}>
    <div className={styles.dancer} />
    <p>{pick(["Renegade dance tutorial 💃 (slowed)", "learn the Savage dance in 30 sec", "quarantine dance challenge #stayhome"], seed)}</p>
  </div>
);

const CALL: Variant[] = [CallGrid, Dalgona, CallGrid, Sourdough, Curve, CallGrid, TigerKing, TikTokDance];

/* ======================= 2012 — going viral (flat monitors) ======================= */

const YtPage = ({ title, views, children }: { title: string; views: string; children: ReactNode }) => (
  <div className={styles.ytPage}>
    <div className={styles.ytTop}>
      <i />
      <em />
    </div>
    <div className={styles.ytVideo}>{children}</div>
    <div className={styles.ytBar}>
      <span />
    </div>
    <div className={styles.ytMeta}>
      <b>{title}</b>
      <span>{views}</span>
    </div>
  </div>
);

const YtThumb: Variant = ({ seed, img }) => (
  <YtPage title="Most viewed this week" views={`${(seed % 900) + 100},${(seed * 37) % 900 + 100},${(seed * 71) % 900 + 100} views`}>
    {img ? <img src={img} alt="" decoding="async" /> : <div className={styles.ytFallback} />}
  </YtPage>
);

const Gangnam: Variant = () => (
  <YtPage title="PSY - GANGNAM STYLE (강남스타일) M/V" views="1,000,000,000 views">
    <div className={styles.gangnam}>
      <span>1,000,000,000</span>
    </div>
  </YtPage>
);

const Harlem: Variant = () => (
  <YtPage title="Harlem Shake (office edition)" views="12,487,190 views">
    <div className={styles.harlem}>
      {Array.from({ length: 9 }).map((_, i) => (
        <i key={i} />
      ))}
    </div>
  </YtPage>
);

const OldInsta: Variant = ({ seed }) => (
  <div className={styles.oldInsta}>
    <div className={styles.oldInstaHead}>Instagram</div>
    <div className={styles.oldInstaPhoto} style={{ backgroundImage: `url(${still(seed + 2)})` }} />
    <div className={styles.filters}>
      {["Valencia", "X-Pro II", "Lo-fi", "Earlybird"].map((f) => (
        <span key={f}>{f}</span>
      ))}
    </div>
  </div>
);

const Vine: Variant = ({ seed }) => (
  <div className={styles.vine}>
    <div className={styles.vineHead}>vine</div>
    <div className={styles.vineVideo}>
      <span>↻ 6s</span>
    </div>
    <p>{pick(["do it for the vine", "look at all those chickens", "what are those"], seed)}</p>
  </div>
);

const Planking: Variant = () => (
  <div className={styles.fb}>
    <div className={styles.fbBar}>facebook</div>
    <div className={styles.fbPost}>
      <b>Daan</b>
      <p>planking on the fridge lol 😂</p>
      <div className={styles.plank}>
        <i />
      </div>
      <span>👍 34 people like this</span>
    </div>
  </div>
);

const Tumblr: Variant = ({ seed }) => (
  <div className={styles.tumblr}>
    <div className={styles.tumblrPost}>
      <div className={styles.tumblrGif} />
      <span>{(seed * 131) % 90000 + 1200} notes · ↻ reblog</span>
    </div>
  </div>
);

const YT: Variant[] = [YtThumb, Gangnam, OldInsta, YtThumb, Harlem, Vine, YtThumb, Planking, Tumblr];

/* ======================= 2005 — online (silver LCDs) ======================= */

const BUDDIES = ["~*sweet*~", "xX_skater_Xx", "Lisa ♥", "brb dinner", "Noor (Away)", "Daan", "*~music~*"];

const Msn: Variant = ({ seed }) => (
  <div className={styles.xp}>
    <div className={styles.msnWin}>
      <div className={styles.msnTitle}>Messenger</div>
      <div className={styles.msnBody}>
        {[0, 1, 2, 3, 4].map((i) => (
          <p key={i}>
            <i className={(seed + i) % 3 === 0 ? styles.away : ""} />
            {BUDDIES[(seed + i) % BUDDIES.length]}
          </p>
        ))}
      </div>
    </div>
    {seed % 2 === 0 && <div className={styles.nudge}>Daan has sent you a nudge!</div>}
  </div>
);

const MySpace: Variant = () => (
  <div className={styles.myspace}>
    <h6>~*welcome 2 my page*~</h6>
    <p className={styles.tom}>Tom is in your extended network</p>
    <p className={styles.top8}>Top 8</p>
    <div className={styles.top8Grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <i key={i} style={{ background: `hsl(${i * 45} 60% 60%)` }} />
      ))}
    </div>
    <p className={styles.nowPlaying}>♫ now playing: my chemical romance</p>
  </div>
);

const Hyves: Variant = () => (
  <div className={styles.hyves}>
    <div className={styles.hyvesBar}>Hyves</div>
    <div className={styles.hyvesBody}>
      <b>Krabbels (12)</b>
      <p>gezellig vandaag!! xxx</p>
      <p>respect voor je foto's ;)</p>
      <p>kom je zaterdag ook?</p>
    </div>
  </div>
);

const LimeWire: Variant = ({ seed }) => (
  <div className={styles.lime}>
    <div className={styles.limeBar}>Downloads</div>
    {["Crazy Frog - Axel F.mp3", "linkin park - numb.mp3", "Numa Numa.wmv", "Gorillaz - Feel Good Inc.mp3"].map((f, i) => (
      <div key={f} className={styles.limeRow}>
        <span>{f}</span>
        <i style={{ width: `${((seed + i * 29) * 37) % 90 + 10}%` }} />
      </div>
    ))}
  </div>
);

const EarlyYt: Variant = () => (
  <div className={styles.earlyYt}>
    <div className={styles.earlyYtHead}>
      YouTube <small>Broadcast Yourself</small>
    </div>
    <div className={styles.earlyYtVideo}>
      <span>▶</span>
    </div>
    <p>Me at the zoo · 0:19</p>
  </div>
);

const Flash: Variant = ({ seed }) => (
  <div className={styles.flash}>
    <h6>{pick(["Stick Fight 2", "Bloons", "Free Rider", "Fancy Pants"], seed)}</h6>
    <p>FREE ONLINE GAMES</p>
    <div className={styles.flashBar}>
      <i style={{ width: `${(seed * 23) % 80 + 15}%` }} />
    </div>
    <span>loading...</span>
  </div>
);

const MSN: Variant[] = [Msn, MySpace, LimeWire, Hyves, EarlyYt, Msn, Flash];

/* ======================= late 90s — the early web (beige CRTs) ======================= */

const Homepage: Variant = ({ seed }) => (
  <div className={styles.browser}>
    <div className={styles.webChrome} />
    <div className={styles.webPage}>
      <h6>Welcome to my Homepage!</h6>
      <u>Links</u>
      <u>Guestbook</u>
      <u>About me</u>
      <div className={styles.construction}>UNDER CONSTRUCTION</div>
      <small>You are visitor #{String(1000 + ((seed * 377) % 9000)).padStart(6, "0")}</small>
    </div>
  </div>
);

const Win95: Variant = () => (
  <div className={styles.win95}>
    <div className={styles.icons}>
      <span>My Computer</span>
      <span>Recycle Bin</span>
      <span>Internet</span>
    </div>
    <div className={styles.dialog}>
      <div className={styles.dialogTitle}>Dial-Up Networking</div>
      <p>Connecting at 28,800 bps...</p>
      <div className={styles.dialBar}>
        <i />
      </div>
    </div>
    <div className={styles.taskbar}>
      <b>Start</b>
    </div>
  </div>
);

const GotMail: Variant = () => (
  <div className={styles.gotMail}>
    <div className={styles.envelope} />
    <p>You’ve got mail!</p>
  </div>
);

const Hampster: Variant = () => (
  <div className={styles.hampster}>
    <h6>The Hampster Dance</h6>
    <div className={styles.hamsters}>
      {Array.from({ length: 12 }).map((_, i) => (
        <i key={i} />
      ))}
    </div>
  </div>
);

const Y2K: Variant = ({ seed }) => (
  <div className={styles.y2k}>
    <p>Y2K COUNTDOWN</p>
    <b>
      {String(seed % 24).padStart(2, "0")}:{String((seed * 7) % 60).padStart(2, "0")}:{String((seed * 13) % 60).padStart(2, "0")}
    </b>
    <span>are your computers ready?</span>
  </div>
);

const Directory: Variant = () => (
  <div className={styles.browser}>
    <div className={styles.webChrome} />
    <div className={styles.directory}>
      <h6>Web Directory</h6>
      <div className={styles.search}>
        <i /> <b>Search</b>
      </div>
      <p>
        <u>Arts</u> · <u>Business</u> · <u>Computers</u>
      </p>
      <p>
        <u>Games</u> · <u>Music</u> · <u>News</u>
      </p>
      <p>
        <u>Chat rooms</u> · <u>Cool sites</u>
      </p>
    </div>
  </div>
);

const ChatRoom: Variant = () => (
  <div className={styles.chatRoom}>
    <p>
      <b>skaterboi97:</b> a/s/l?
    </p>
    <p>
      <b>xXangelXx:</b> lol
    </p>
    <p>
      <b>cooldude:</b> brb mom needs the phone
    </p>
    <p className={styles.chatSys}>*** cooldude has left the room</p>
  </div>
);

const Solitaire: Variant = ({ seed }) => (
  <div className={styles.solitaire}>
    {Array.from({ length: 10 }).map((_, i) => (
      <i key={i} style={{ left: `${8 + i * 7 + (seed % 5)}%`, top: `${10 + ((i * i * 3 + seed) % 55)}%` }} />
    ))}
  </div>
);

const WEB: Variant[] = [Homepage, Win95, GotMail, Hampster, Directory, Y2K, ChatRoom, Solitaire];

const ERA_VARIANTS: Record<TunnelEra, Variant[]> = { now: NOW, call: CALL, yt: YT, msn: MSN, web: WEB };

/** the content of one tunnel screen */
export default function TunnelScreen({ era, seed, img }: { era: TunnelEra; seed: number; img?: string }) {
  const list = ERA_VARIANTS[era];
  // a scrambled pick, so the trends are spread evenly along the corridor
  const h = Math.imul(seed ^ (seed >>> 3), 2654435761) >>> 0;
  const V = list[h % list.length];
  return <>{V({ seed, img })}</>;
}