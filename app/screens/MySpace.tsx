"use client";

import { useEffect, useState } from "react";
import { VT323 } from "next/font/google";
import { ASSETS, Img } from "./shared";

const pixel = VT323({ weight: "400", subsets: ["latin"] });

const VIDEO_URL = "/youtube";

const BANNER_TEXT = "IF U SKIP MY PROFILE SONG UR CHOPPED!!!";
const SONG = 'DJ Unc & The Sigma Boys - "John Pork (Hallway Remix)" [128kbps]';
const SONG_LENGTH = 201; // seconds (3:21)

const BLOG = [
  "tips on how to get students to stop asking for a feedpulse",
  "Top 10 reasons aliens are coming to earth",
  "what to talk about with your newborn daughter??",
];

const FRIENDS = ["@L0dy_L0c0_123", "@Geene_Of_The_Lamp", "@_P13t3r_D0r5t_"];

const NAV = [
  "Home",
  "Blog",
  "Friends",
  "Comments",
  "Music",
  "Aura Farm",
  "Videos",
];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/* 2006: MySpace profile of @Stansino_Oers67 */
export default function MySpace() {
  // fake music player
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => setSeconds((s) => (s + 1) % SONG_LENGTH),
      1000,
    );
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <div className="m-page" style={{ backgroundImage: `url(${ASSETS.zebra})` }}>
      {/* header */}
      <header className="m-header">
        <div className="m-logo">
          <span>
            My<span className="m-logo-light">Space</span>.com
          </span>
          <small>A place for friends</small>
        </div>
        <form className="m-search" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="m-search-input" className="g-hidden">
            Search
          </label>
          <input id="m-search-input" type="text" />
          <button type="submit">Search</button>
        </form>
      </header>

      <nav className="m-nav">
        {NAV.map((item) => (
          <a key={item} href="#" onClick={(e) => e.preventDefault()}>
            {item}
          </a>
        ))}
      </nav>

      {/* moving banner (the text is there twice so the loop is seamless) */}
      <div className={`m-marquee ${pixel.className}`} aria-label={BANNER_TEXT}>
        <div className="m-marquee-track" aria-hidden="true">
          {[0, 1].map((half) => (
            <span key={half}>
              {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="m-marquee-item">
                  {BANNER_TEXT}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* white profile panel */}
      <main className="m-panel">
        <section className="m-top">
          <Img
            className="m-photo"
            src={ASSETS.profilePic}
            alt="Profile picture of Stansino"
          />

          <div className="m-top-right">
            <h1 className="m-name">@Stansino_Oers67</h1>

            <div className="m-box">
              <h2>About Me</h2>
              <div className="m-box-body m-about">
                <div>
                  <p>
                    <b>Alpha male/32</b>
                  </p>
                  <p>
                    <b>Mood:</b> Grading Portfolios
                  </p>
                  <p>
                    <b>Status:</b> Married (Happily!)
                  </p>
                  <p>
                    <b>Zodiac sign:</b> Scorpio
                  </p>
                  <p className="m-online">
                    <span className="m-dot" /> Online now!
                  </p>
                </div>
                <Img
                  className="m-scorpion"
                  src={ASSETS.scorpion}
                  alt="Scorpion"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="m-box">
          <h2>Profile Song</h2>
          <div className="m-box-body">
            <div
              className={`m-player ${pixel.className} ${playing ? "is-playing" : ""}`}
            >
              <div className="m-screen">{SONG}</div>
              <div className="m-controls">
                <button
                  type="button"
                  className="m-play"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? "❚❚" : "▶"}
                </button>
                <div className="m-bar">
                  <div
                    className="m-bar-fill"
                    style={{ width: `${(seconds / SONG_LENGTH) * 100}%` }}
                  />
                </div>
                <div className="m-eq" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <span className="m-time">{formatTime(seconds)}</span>
              </div>
            </div>
          </div>
        </div>

        <section className="m-cols">
          <div className="m-box">
            <h2>Latest Blog Entries</h2>
            <div className="m-box-body">
              <ul className="m-blog">
                {BLOG.map((title) => (
                  <li key={title}>
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      {title}
                    </a>
                    <span className="m-view-more">(view more)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="m-side">
            <div className="m-box">
              <h2>Top Friends</h2>
              <div className="m-box-body m-friends">
                {FRIENDS.map((friend, i) => (
                  <div key={friend} className="m-friend">
                    <Img src={ASSETS.friends[i]} alt="" />
                    <span>{friend}</span>
                  </div>
                ))}
              </div>
            </div>
            <Img
              className="m-banner"
              src={ASSETS.banners}
              alt="cybercriminal"
            />
          </div>
        </section>

        <div className="m-box">
          <h2>Recommendations</h2>
          <div className="m-box-body m-rec">
            <a
              className="m-thumb"
              href={VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Img src={ASSETS.videoThumb} alt="" />
              <span className="m-rec-label">● REC</span>
              <span className="m-thumb-play">▶</span>
              <span className="m-duration">4:22</span>
            </a>
            <div className="m-rec-info">
              <a
                className="m-rec-title"
                href={VIDEO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                OMG U HAVE 2 SEE THIS VIDEO!!!!!! (NOW PLS)
              </a>
              <p>+1000 aura per watch</p>
              <div className="m-rec-bottom">
                <span>
                  69 billion views <span className="m-stars">★★★★★</span>
                </span>
                <a
                  className="m-yt"
                  href={VIDEO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ▶ Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>

        <footer className="m-footer">
          FAQ · Terms · Privacy · Safety Tips · ©2006-2026 MySpace.com (a
          parody)
        </footer>
      </main>
    </div>
  );
}
