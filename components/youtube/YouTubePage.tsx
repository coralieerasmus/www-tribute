"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import BrandImage from "@/components/BrandImage";
import ZoomInvite from "@/components/zoom/ZoomInvite";
import { BRAND, TIMINGS } from "@/lib/experience";
import { unlockAudio } from "@/lib/sounds";
import YTPlayer, { type PlayerHandle } from "./YTPlayer";
import Comments from "./Comments";
import { VIDEOS, thumbnailFor, type Video } from "./videos";
import styles from "./youtube.module.css";

const n = (x: number) => x.toLocaleString("en-US");

export default function YouTubePage() {
  const [videoId, setVideoId] = useState(VIDEOS[0].id);
  const [theater, setTheater] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState<number | null>(null);
  const playerRef = useRef<PlayerHandle>(null);

  const video = VIDEOS.find((v) => v.id === videoId) ?? VIDEOS[0];
  const upNext = useMemo(() => {
    const i = VIDEOS.findIndex((v) => v.id === videoId);
    return [...VIDEOS.slice(i + 1), ...VIDEOS.slice(0, i)];
  }, [videoId]);

  const open = useCallback((v: Video) => {
    setUpNextCountdown(null);
    setVideoId(v.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /* The call comes in after a while, wherever you are on the page. */
  useEffect(() => {
    const t = setTimeout(() => {
      playerRef.current?.pause();
      setShowInvite(true);
    }, TIMINGS.youtubeBeforeCallMs);
    return () => clearTimeout(t);
  }, []);

  /* Browsers only allow sound after an interaction: unlock on the first one. */
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  /* Autoplay countdown after a video ends */
  useEffect(() => {
    if (upNextCountdown === null || showInvite) return;
    if (upNextCountdown <= 0) {
      open(upNext[0]);
      return;
    }
    const t = setTimeout(() => setUpNextCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [upNextCountdown, upNext, open, showInvite]);

  const onEnded = useCallback(() => {
    if (autoplay) setUpNextCountdown(5);
  }, [autoplay]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={`${styles.main} ${theater ? styles.mainTheater : ""}`}>
        <div className={styles.primary}>
          <YTPlayer
            key={video.id}
            ref={playerRef}
            video={video}
            onEnded={onEnded}
            onNext={() => open(upNext[0])}
            theater={theater}
            onToggleTheater={() => setTheater((t) => !t)}
          />
          {upNextCountdown !== null && (
            <div className={styles.autoplayBanner}>
              <span>
                Up next in <b>{upNextCountdown}</b>: {upNext[0].title}
              </span>
              <button onClick={() => setUpNextCountdown(null)}>Cancel</button>
            </div>
          )}
          <VideoInfo key={`info-${video.id}`} video={video} />
          <Description key={`desc-${video.id}`} video={video} />
          <Comments key={`comments-${video.id}`} video={video} />
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.upNextHeader}>
            <span>Up next</span>
            <label className={styles.autoplayToggle}>
              Autoplay
              <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
              <span className={styles.switch} />
            </label>
          </div>
          {upNext.map((v, i) => (
            <div key={v.id}>
              <SideItem video={v} onClick={() => open(v)} />
              {i === 0 && <hr className={styles.sideDivider} />}
            </div>
          ))}
          <button className={styles.showMore}>Show more</button>
        </aside>
      </main>

      {showInvite && <ZoomInvite />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Header() {
  const [q, setQ] = useState("");
  const [nope, setNope] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Searching is not allowed in this experience :)
    setNope(true);
    setTimeout(() => setNope(false), 600);
  };
  return (
    <header className={styles.header}>
      <button className={styles.burger} aria-label="Guide">
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="#666" strokeWidth="2.4" />
        </svg>
      </button>
      <div className={styles.logo}>
        <BrandImage
          src={BRAND.youtubeLogo}
          alt="YouTube"
          className={styles.logoImg}
          fallback={<span className={styles.logoText}>YouTube</span>}
        />
      </div>
      <form className={`${styles.search} ${nope ? styles.searchNope : ""}`} onSubmit={submit}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" />
        <button type="submit" aria-label="Search">
          <svg width="22" height="22" viewBox="0 0 24 24">
            <circle cx="10" cy="10" r="6.5" fill="none" stroke="#777" strokeWidth="2.2" />
            <path d="M15 15l6 6" stroke="#777" strokeWidth="2.6" />
          </svg>
        </button>
      </form>
      <div className={styles.headerRight}>
        <button className={styles.uploadBtn}>Upload</button>
        <div className={styles.headerAvatar} />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
function VideoInfo({ video }: { video: Video }) {
  const [vote, setVote] = useState<"like" | "dislike" | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [panel, setPanel] = useState<"add" | "share" | "more" | null>(null);
  const [lists, setLists] = useState({ "Watch Later": false, Favorites: false });
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);

  const likes = video.likes + (vote === "like" ? 1 : 0);
  const dislikes = video.dislikes + (vote === "dislike" ? 1 : 0);
  const ratio = likes / Math.max(1, likes + dislikes);
  const subs = video.subscribers + (subscribed ? 1 : 0);
  const shareUrl = video.youtubeId ? `http://youtu.be/${video.youtubeId}` : `http://youtu.be/${video.id}`;

  return (
    <section className={styles.card}>
      <h1 className={styles.title}>{video.title}</h1>
      <div className={styles.ownerRow}>
        <div className={styles.owner}>
          <div className={styles.channelAvatar}>
            {video.youtubeId ? <img src={thumbnailFor(video)} alt="" /> : video.channel.charAt(0)}
          </div>
          <div>
            <div className={styles.channelName}>{video.channel}</div>
            <div className={styles.subscribeGroup}>
              <button
                className={`${styles.subscribe} ${subscribed ? styles.subscribed : ""}`}
                onClick={() => setSubscribed((s) => !s)}
              >
                {subscribed ? (
                  <>
                    <span className={styles.check}>✓</span> Subscribed
                  </>
                ) : (
                  <>
                    <span className={styles.subscribeIcon}>
                      <svg width="14" height="10" viewBox="0 0 14 10">
                        <path d="M0 0h14v10H0z" fill="#fff" />
                        <path d="M5 2l5 3-5 3z" fill="#e62117" />
                      </svg>
                    </span>
                    Subscribe
                  </>
                )}
              </button>
              <span className={styles.subCount}>{n(subs)}</span>
            </div>
          </div>
        </div>
        <div className={styles.viewsBlock}>
          <div className={styles.views}>{n(video.views)} views</div>
          <div className={styles.ratioBar}>
            <div style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <div className={styles.actionsLeft}>
          <button className={`${styles.action} ${panel === "add" ? styles.actionActive : ""}`} onClick={() => setPanel(panel === "add" ? null : "add")}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M11 4h2v16h-2zM4 11h16v2H4z" fill="currentColor" />
            </svg>
            Add to
          </button>
          <button className={`${styles.action} ${panel === "share" ? styles.actionActive : ""}`} onClick={() => setPanel(panel === "share" ? null : "share")}>
            <svg width="20" height="18" viewBox="0 0 24 20">
              <path d="M14 0l10 9-10 9v-5C7 13 3 15 0 20 1 13 5 7 14 6z" fill="currentColor" />
            </svg>
            Share
          </button>
          <button className={`${styles.action} ${panel === "more" ? styles.actionActive : ""}`} onClick={() => setPanel(panel === "more" ? null : "more")}>
            <span className={styles.dots}>•••</span>
            More
          </button>
        </div>
        <div className={styles.votes}>
          <button
            className={`${styles.vote} ${vote === "like" ? styles.voteOn : ""}`}
            onClick={() => setVote(vote === "like" ? null : "like")}
            aria-label="I like this"
          >
            <ThumbIcon />
            {n(likes)}
          </button>
          <button
            className={`${styles.vote} ${vote === "dislike" ? styles.voteOn : ""}`}
            onClick={() => setVote(vote === "dislike" ? null : "dislike")}
            aria-label="I dislike this"
          >
            <ThumbIcon down />
            {n(dislikes)}
          </button>
        </div>
      </div>

      {panel === "add" && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Add to</div>
          {(Object.keys(lists) as (keyof typeof lists)[]).map((k) => (
            <label key={k} className={styles.listItem}>
              <input type="checkbox" checked={lists[k]} onChange={() => setLists((l) => ({ ...l, [k]: !l[k] }))} />
              {k}
              {lists[k] && <span className={styles.added}>Added</span>}
            </label>
          ))}
          <button className={styles.linkBtn}>+ Create new playlist</button>
        </div>
      )}
      {panel === "share" && (
        <div className={styles.panel}>
          <div className={styles.shareTabs}>
            <span className={styles.shareTabActive}>Share this video</span>
            <span>Embed</span>
            <span>Email</span>
          </div>
          <div className={styles.shareCircles}>
            {["#3b5998", "#55acee", "#dd4b39", "#cb2027", "#0077b5", "#ff4500"].map((c) => (
              <span key={c} className={styles.shareCircle} style={{ background: c }} />
            ))}
          </div>
          <div className={styles.shareRow}>
            <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
            <button
              className={styles.greyBtn}
              onClick={() => {
                void navigator.clipboard?.writeText(shareUrl).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <label className={styles.listItem}>
            <input type="checkbox" /> Start at: 0:00
          </label>
        </div>
      )}
      {panel === "more" && (
        <div className={styles.panel}>
          <button className={styles.moreItem} onClick={() => setReported(true)}>
            ⚑ Report
          </button>
          {reported && <div className={styles.reported}>Thanks. We&apos;ll look into it. (We won&apos;t.)</div>}
          <button className={styles.moreItem}>≡ Transcript</button>
          <button className={styles.moreItem}>▤ Statistics</button>
        </div>
      )}
    </section>
  );
}

function ThumbIcon({ down }: { down?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={down ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M2 10h4v12H2zM8 22h10c1 0 1.8-.6 2-1.5l2-8c.3-1.3-.7-2.5-2-2.5h-6l1-5c.2-1-.6-2-1.6-2L8 10z" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
function Description({ video }: { video: Video }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={styles.card}>
      <div className={styles.published}>Published on {video.published}</div>
      <div className={`${styles.description} ${open ? styles.descriptionOpen : ""}`}>
        {video.description}
        {open && (
          <div className={styles.meta}>
            <div>
              <b>Category</b> Music
            </div>
            <div>
              <b>License</b> Standard YouTube License
            </div>
          </div>
        )}
      </div>
      <button className={styles.showMoreDesc} onClick={() => setOpen((o) => !o)}>
        {open ? "SHOW LESS" : "SHOW MORE"}
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
function SideItem({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <button className={styles.sideItem} onClick={onClick}>
      <div className={styles.sideThumb}>
        {thumbnailFor(video) ? <img src={thumbnailFor(video)} alt="" /> : <div className={styles.thumbPlaceholder} />}
        <span className={styles.duration}>{video.duration}</span>
        <span className={styles.watchLater} title="Watch Later">
          <svg width="14" height="14" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="2.5" />
            <path d="M12 7v6l4 2" stroke="#fff" strokeWidth="2.5" fill="none" />
          </svg>
        </span>
      </div>
      <div className={styles.sideMeta}>
        <div className={styles.sideTitle}>{video.title}</div>
        <div className={styles.sideChannel}>by {video.channel}</div>
        <div className={styles.sideViews}>{n(video.views)} views</div>
      </div>
    </button>
  );
}
