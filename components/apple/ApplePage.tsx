"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandImage from "@/components/BrandImage";
import { BRAND, ROUTES, TIMINGS } from "@/lib/experience";
import { unlockAudio } from "@/lib/sounds";
import LaptopScene from "./LaptopScene";
import ScreenBreak from "./ScreenBreak";
import styles from "./apple.module.css";

type Finish = { name: string; swatch: string; tint: string };
type Model = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  chip: string;
  display: string;
  battery: string;
  weight: string;
  memory: string;
  finishes: Finish[];
};

const MODELS: Model[] = [
  {
    id: "neo",
    name: "MacBook Neo",
    tagline: "Colourful. Capable. Surprisingly affordable.",
    price: 799,
    chip: "A18 Pro chip",
    display: "13-inch Liquid Retina display",
    battery: "Up to 16 hours battery",
    weight: "1.2 kg",
    memory: "8GB unified memory",
    finishes: [
      { name: "Blush", swatch: "#f4b9cf", tint: "#ffd6e6" },
      { name: "Citrus", swatch: "#d9ec5b", tint: "#f1ffb0" },
      { name: "Indigo", swatch: "#6f7fd8", tint: "#c3cbff" },
      { name: "Silver", swatch: "#e3e4e6", tint: "#ffffff" },
    ],
  },
  {
    id: "air",
    name: "MacBook Air",
    tagline: "Impossibly thin. Seriously fast.",
    price: 1199,
    chip: "M5 chip",
    display: "13- or 15-inch Liquid Retina display",
    battery: "Up to 18 hours battery",
    weight: "1.24 kg",
    memory: "16GB unified memory",
    finishes: [
      { name: "Midnight", swatch: "#2e3642", tint: "#ffffff" },
      { name: "Starlight", swatch: "#f0e4d3", tint: "#fff3e0" },
      { name: "Sky Blue", swatch: "#b6d1ea", tint: "#d8ebff" },
    ],
  },
  {
    id: "pro",
    name: "MacBook Pro",
    tagline: "A monster of a laptop. Now with M5 Pro and M5 Max.",
    price: 1999,
    chip: "M5, M5 Pro or M5 Max chip",
    display: "14- or 16-inch Liquid Retina XDR display",
    battery: "Up to 24 hours battery",
    weight: "1.55 kg",
    memory: "Up to 128GB unified memory",
    finishes: [
      { name: "Space Black", swatch: "#2b2b2d", tint: "#9a9a9a" },
      { name: "Silver", swatch: "#e3e4e6", tint: "#ffffff" },
    ],
  },
];

const HIGHLIGHTS = [
  { kicker: "Battery", title: "All‑day battery. And then some.", bg: "linear-gradient(160deg,#0b3d2e,#000 70%)" },
  { kicker: "Display", title: "Colours so vivid, it feels unfair.", bg: "linear-gradient(160deg,#3b0b48,#000 70%)" },
  { kicker: "Performance", title: "Blazing fast. Even with 47 tabs open.", bg: "linear-gradient(160deg,#4a1a05,#000 70%)" },
  { kicker: "Video calls", title: "Never freeze on a call again.", bg: "linear-gradient(160deg,#08254d,#000 70%)" },
];

const euro = (n: number) => `€${n.toLocaleString("nl-NL")}`;

export default function ApplePage() {
  const router = useRouter();
  const [modelIdx, setModelIdx] = useState(0);
  const [finishIdx, setFinishIdx] = useState(0);
  const [spinKey, setSpinKey] = useState(0);
  const [bag, setBag] = useState<{ name: string; finish: string; price: number }[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [breakOrigin, setBreakOrigin] = useState<[number, number] | null>(null);
  const pointer = useRef<[number, number] | null>(null);

  const detailsRef = useRef<HTMLElement>(null);
  const compareRef = useRef<HTMLElement>(null);
  const supportRef = useRef<HTMLElement>(null);

  const model = MODELS[modelIdx];
  const finish = model.finishes[Math.min(finishIdx, model.finishes.length - 1)];

  /* the countdown to disaster */
  useEffect(() => {
    router.prefetch(ROUTES.landing);
    const t = setTimeout(() => {
      setBreakOrigin(pointer.current); // the screen cracks where the cursor is
      setBreaking(true);
    }, TIMINGS.appleBeforeBreakMs);
    return () => clearTimeout(t);
  }, [router]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => (pointer.current = [e.clientX, e.clientY]);
    const onScroll = () => setScrolled(window.scrollY > 20);
    const unlock = () => unlockAudio();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  const pickModel = (i: number) => {
    if (i === modelIdx) return;
    setModelIdx(i);
    setFinishIdx(0);
    setSpinKey((k) => k + 1);
  };

  const addToBag = (m: Model, f: Finish) => {
    setBag((b) => [...b, { name: m.name, finish: f.name, price: m.price }]);
    flash(`${m.name} – ${f.name} added to your bag`);
  };

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const onBreakDone = useCallback(() => router.replace(ROUTES.landing), [router]);

  return (
    <>
    <div className={`${styles.page} ${breaking ? styles.pageBroken : ""}`}>
      {/* ---------- nav ---------- */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <button className={styles.navLogo} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Home">
          <BrandImage src={BRAND.appleLogo} alt="" className={styles.navLogoImg} />
        </button>
        <button className={styles.navItem} onClick={() => scrollTo(compareRef.current)}>
          Store
        </button>
        <button className={styles.navItem} onClick={() => scrollTo(detailsRef.current)}>
          Mac
        </button>
        <button className={styles.navItem} onClick={() => scrollTo(supportRef.current)}>
          Support
        </button>
        <div className={styles.bagWrap}>
          <button className={styles.navBag} onClick={() => setBagOpen((o) => !o)} aria-label="Bag">
            <svg width="16" height="20" viewBox="0 0 16 20">
              <path d="M4.5 6V4.5a3.5 3.5 0 0 1 7 0V6" fill="none" stroke="#fff" strokeWidth="1.4" />
              <rect x="1" y="6" width="14" height="13" rx="2.5" fill="#fff" />
            </svg>
            {bag.length > 0 && <span className={styles.bagCount}>{bag.length}</span>}
          </button>
          {bagOpen && (
            <div className={styles.bagMenu}>
              <h4>Bag</h4>
              {bag.length === 0 ? (
                <p className={styles.bagEmpty}>Your Bag is empty.</p>
              ) : (
                <>
                  <ul>
                    {bag.map((b, i) => (
                      <li key={i}>
                        <span>
                          {b.name}
                          <small>{b.finish}</small>
                        </span>
                        <span>{euro(b.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.bagTotal}>
                    <span>Total</span>
                    <span>{euro(bag.reduce((s, b) => s + b.price, 0))}</span>
                  </div>
                  <button className={styles.blueBtn} onClick={() => flash("Something went wrong. Please try again later.")}>
                    Check Out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ---------- hero ---------- */}
      <header className={styles.hero}>
        <LaptopScene tint={finish.tint} spinKey={spinKey} />
        <div className={styles.modelTabs}>
          {MODELS.map((m, i) => (
            <button key={m.id} className={`${styles.modelTab} ${i === modelIdx ? styles.modelTabActive : ""}`} onClick={() => pickModel(i)}>
              {m.name.replace("MacBook", "Macbook")}
            </button>
          ))}
        </div>
      </header>

      {/* ---------- selected model ---------- */}
      <section ref={detailsRef} className={styles.details} key={model.id}>
        <div className={styles.detailsLeft}>
          <p className={styles.eyebrow}>New</p>
          <h1 className={styles.detailsTitle}>{model.name}</h1>
          <p className={styles.tagline}>{model.tagline}</p>
          <div className={styles.finishes}>
            {model.finishes.map((f, i) => (
              <button
                key={f.name}
                className={`${styles.swatch} ${f === finish ? styles.swatchActive : ""}`}
                style={{ background: f.swatch }}
                onClick={() => setFinishIdx(i)}
                aria-label={f.name}
                title={f.name}
              />
            ))}
            <span className={styles.finishName}>{finish.name}</span>
          </div>
          <p className={styles.price}>From {euro(model.price)}</p>
          <div className={styles.ctaRow}>
            <button className={styles.blueBtn} onClick={() => addToBag(model, finish)}>
              Buy
            </button>
            <button className={styles.linkBtn} onClick={() => scrollTo(compareRef.current)}>
              Compare models ›
            </button>
          </div>
        </div>
        <ul className={styles.specs}>
          <li>
            <span className={styles.specIcon}>◼︎</span>
            {model.chip}
          </li>
          <li>
            <span className={styles.specIcon}>▭</span>
            {model.display}
          </li>
          <li>
            <span className={styles.specIcon}>⚡︎</span>
            {model.battery}
          </li>
          <li>
            <span className={styles.specIcon}>◎</span>
            {model.memory}
          </li>
          <li>
            <span className={styles.specIcon}>⚖︎</span>
            {model.weight}
          </li>
        </ul>
      </section>

      {/* ---------- highlights ---------- */}
      <section className={styles.highlights}>
        <h2 className={styles.sectionTitle}>Get the highlights.</h2>
        <div className={styles.gallery}>
          {HIGHLIGHTS.map((h) => (
            <article key={h.title} className={styles.card} style={{ background: h.bg }}>
              <p className={styles.cardKicker}>{h.kicker}</p>
              <h3 className={styles.cardTitle}>{h.title}</h3>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- compare ---------- */}
      <section ref={compareRef} className={styles.compare}>
        <h2 className={styles.sectionTitle}>Which Mac laptop is right for you?</h2>
        <div className={styles.compareGrid}>
          {MODELS.map((m, i) => (
            <div key={m.id} className={`${styles.compareCol} ${i === modelIdx ? styles.compareColActive : ""}`}>
              <div className={styles.compareSwatches}>
                {m.finishes.map((f) => (
                  <span key={f.name} style={{ background: f.swatch }} />
                ))}
              </div>
              <h3>{m.name}</h3>
              <p className={styles.compareTag}>{m.tagline}</p>
              <p className={styles.comparePrice}>From {euro(m.price)}</p>
              <div className={styles.compareBtns}>
                <button className={styles.blueBtn} onClick={() => addToBag(m, m.finishes[0])}>
                  Buy
                </button>
                <button
                  className={styles.linkBtn}
                  onClick={() => {
                    pickModel(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Learn more ›
                </button>
              </div>
              <ul>
                <li>{m.chip}</li>
                <li>{m.display}</li>
                <li>{m.memory}</li>
                <li>{m.battery}</li>
                <li>{m.weight}</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- support / footer ---------- */}
      <footer ref={supportRef} className={styles.footer}>
        <div className={styles.footerCols}>
          {[
            ["Shop and Learn", "Store", "Mac", "Accessories", "Gift Cards"],
            ["Support", "Mac Support", "Repair", "Trade In", "Order Status"],
            ["Values", "Accessibility", "Environment", "Privacy"],
          ].map(([head, ...items]) => (
            <div key={head}>
              <h5>{head}</h5>
              {items.map((it) => (
                <button key={it} onClick={() => flash("This page is temporarily unavailable.")}>
                  {it}
                </button>
              ))}
            </div>
          ))}
        </div>
        <p className={styles.fineprint}>Concept store made for a school project. Not affiliated with any real company.</p>
      </footer>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>

    {/* rendered outside the page so the page's "jolt" transform can't move it */}
    {breaking && (
      <ScreenBreak origin={breakOrigin} durationMs={TIMINGS.screenBreakMs} image="/images/broken-screen.jpg" onDone={onBreakDone} />
    )}
    </>
  );
}
