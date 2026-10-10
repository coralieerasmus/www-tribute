"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import BrandImage from "@/components/BrandImage";
import { BRAND, ROUTES } from "@/lib/experience";
import { AppsIcon, ClockIcon, GoogleLogo, LensIcon, MicIcon, SUGGESTIONS, SearchIcon, isValidQuery } from "./shared";
import styles from "./google.module.css";

const TARGET = "Apple Laptops";

export default function GoogleHome() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [typing, setTyping] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    router.prefetch(ROUTES.googleSearch);
  }, [router]);

  const go = (query: string, lucky = false) => {
    if (!isValidQuery(query)) {
      setWrong((w) => w + 1);
      return;
    }
    if (lucky) router.push(ROUTES.apple);
    else router.push(`${ROUTES.googleSearch}?q=${encodeURIComponent(query.trim())}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(q);
  };

  /* Clicking the hint "types" it for you, then searches. */
  const typeHint = () => {
    if (typing) return;
    setTyping(true);
    setQ("");
    let i = 0;
    const tick = () => {
      i++;
      setQ(TARGET.slice(0, i));
      if (i < TARGET.length) setTimeout(tick, 55 + Math.random() * 60);
      else setTimeout(() => go(TARGET), 350);
    };
    setTimeout(tick, 120);
  };

  const shown = q.trim()
    ? SUGGESTIONS.filter((s) => s.startsWith(q.toLowerCase().trim()) && s !== q.toLowerCase().trim()).slice(0, 6)
    : SUGGESTIONS.slice(0, 4);
  const showDropdown = focused && shown.length > 0 && !typing;

  return (
    <div className={styles.homePage}>
      <header className={styles.homeTop}>
        <a className={styles.topLink}>Gmail</a>
        <a className={styles.topLink}>Images</a>
        <div className={styles.appsWrap}>
          <button className={styles.iconBtn} aria-label="Google apps" onClick={() => setAppsOpen((o) => !o)}>
            <AppsIcon />
          </button>
          {appsOpen && (
            <div className={styles.appsMenu}>
              {["Account", "Search", "Maps", "YouTube", "Play", "News", "Gmail", "Drive", "Calendar"].map((a, i) => (
                <div key={a} className={styles.appTile}>
                  <span className={styles.appDot} style={{ background: ["#4285f4", "#ea4335", "#fbbc05", "#34a853"][i % 4] }} />
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={styles.avatar} />
      </header>

      <main className={styles.homeMain}>
        <div className={styles.doodle}>
          <BrandImage src={BRAND.googleDoodle} alt="Google" className={styles.doodleImg} fallback={<GoogleLogo />} />
        </div>

        <form className={`${styles.homeSearchWrap} ${wrong ? styles.shake : ""}`} key={wrong} onSubmit={submit}>
          <div className={`${styles.homeSearch} ${showDropdown ? styles.homeSearchOpen : ""}`}>
            <button type="button" className={styles.plusBtn} aria-label="Upload">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="#202124" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              aria-label="Search"
              autoFocus={wrong > 0}
              autoComplete="off"
              spellCheck={false}
            />
            {q && (
              <button type="button" className={styles.clearBtn} onClick={() => setQ("")} aria-label="Clear">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6L6 18" stroke="#70757a" strokeWidth="2" />
                </svg>
              </button>
            )}
            <button type="button" className={styles.iconBtn} aria-label="Search by voice">
              <MicIcon />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Search by image">
              <LensIcon />
            </button>
            <button type="button" className={styles.aiMode}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <circle cx="10" cy="10" r="6" fill="none" stroke="#202124" strokeWidth="2" />
                <path d="M14.5 14.5L20 20" stroke="#202124" strokeWidth="2.2" />
                <path d="M18 2l.8 2.2L21 5l-2.2.8L18 8l-.8-2.2L15 5l2.2-.8z" fill="#202124" />
              </svg>
              AI Mode
            </button>
          </div>
          {showDropdown && (
            <ul className={styles.suggestions}>
              {shown.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQ(s);
                      go(s);
                    }}
                  >
                    {q.trim() ? <SearchIcon size={18} /> : <ClockIcon />}
                    <span>
                      {q.trim() ? (
                        <>
                          {s.slice(0, q.trim().length)}
                          <b>{s.slice(q.trim().length)}</b>
                        </>
                      ) : (
                        s
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className={styles.homeButtons}>
          <button onClick={() => go(q)}>Google Search</button>
          <button onClick={() => go(q, true)}>I&apos;m Feeling Lucky</button>
        </div>

        <p className={`${styles.hint} ${wrong ? styles.hintPulse : ""}`} key={`hint-${wrong}`}>
          Search for:{" "}
          <button className={styles.hintLink} onClick={typeHint}>
            &ldquo;{TARGET}&rdquo;
          </button>
        </p>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerCountry}>Netherlands</div>
        <div className={styles.footerLinks}>
          <div>
            <a>About</a>
            <a>Advertising</a>
            <a>Business</a>
            <a>How Search works</a>
          </div>
          <div>
            <a>Privacy</a>
            <a>Terms</a>
            <a>Settings</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
