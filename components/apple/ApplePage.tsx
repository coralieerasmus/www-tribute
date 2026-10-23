"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import BrandImage from "@/components/BrandImage";
import { BRAND, ROUTES, TIMINGS } from "@/lib/experience";
import { unlockAudio } from "@/lib/sounds";
import BrainrotFinale from "./BrainrotFinale";
import { LockScreen, PhoneFrame } from "./Phone";
import styles from "./apple.module.css";

type Finish = { name: string; frame: string; wallpaper: string };
type Model = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  chip: string;
  display: string;
  camera: string;
  battery: string;
  build: string;
  finishes: Finish[];
};

const MODELS: Model[] = [
  {
    id: "17",
    name: "iPhone 17",
    tagline: "Magichromatic. Brighter than ever.",
    price: 969,
    chip: "A19 chip",
    display: "6.3-inch Super Retina XDR, 120Hz",
    camera: "48MP Dual Fusion camera",
    battery: "Up to 30 hours video playback",
    build: "Aluminium design, Ceramic Shield 2",
    finishes: [
      { name: "Lavender", frame: "#c9b8e8", wallpaper: "radial-gradient(circle at 30% 20%,#f3e8ff,#a78bfa 45%,#4c1d95)" },
      { name: "Sage", frame: "#b9cfa3", wallpaper: "radial-gradient(circle at 30% 20%,#ecfccb,#84cc16 45%,#365314)" },
      { name: "Mist Blue", frame: "#a9c2dc", wallpaper: "radial-gradient(circle at 30% 20%,#e0f2fe,#60a5fa 45%,#1e3a8a)" },
      { name: "Black", frame: "#2b2b2d", wallpaper: "radial-gradient(circle at 30% 20%,#525252,#171717 60%,#000)" },
    ],
  },
  {
    id: "air",
    name: "iPhone Air",
    tagline: "The thinnest iPhone ever. With pro performance inside.",
    price: 1229,
    chip: "A19 Pro chip",
    display: "6.5-inch Super Retina XDR, 120Hz",
    camera: "48MP Fusion camera",
    battery: "Up to 27 hours video playback",
    build: "Titanium design, 5.6 mm thin",
    finishes: [
      { name: "Sky Blue", frame: "#cfe3f3", wallpaper: "radial-gradient(circle at 70% 20%,#f0f9ff,#7dd3fc 45%,#0369a1)" },
      { name: "Light Gold", frame: "#ecdcbf", wallpaper: "radial-gradient(circle at 70% 20%,#fffbeb,#fbbf24 45%,#78350f)" },
      { name: "Cloud White", frame: "#efefec", wallpaper: "radial-gradient(circle at 70% 20%,#ffffff,#d4d4d8 50%,#52525b)" },
      { name: "Space Black", frame: "#1d1d1f", wallpaper: "radial-gradient(circle at 70% 20%,#3f3f46,#09090b 60%)" },
    ],
  },
  {
    id: "pro",
    name: "iPhone 17 Pro",
    tagline: "All out Pro. The most powerful iPhone yet.",
    price: 1329,
    chip: "A19 Pro chip with vapour chamber cooling",
    display: "6.3-inch Super Retina XDR with ProMotion",
    camera: "Pro Fusion camera system, 3 × 48MP",
    battery: "Up to 33 hours video playback",
    build: "Forged aluminium unibody",
    finishes: [
      { name: "Cosmic Orange", frame: "#e07a3a", wallpaper: "radial-gradient(circle at 50% 15%,#ffedd5,#fb923c 40%,#7c2d12)" },
      { name: "Deep Blue", frame: "#2f3d5c", wallpaper: "radial-gradient(circle at 50% 15%,#c7d2fe,#3b5bdb 40%,#0b1437)" },
      { name: "Silver", frame: "#dcdcdc", wallpaper: "radial-gradient(circle at 50% 15%,#ffffff,#a1a1aa 45%,#27272a)" },
    ],
  },
];

const HIGHLIGHTS = [
  { kicker: "Camera", title: "Every moment, ready for your feed.", bg: "linear-gradient(160deg,#4a1a05,#000 70%)" },
  { kicker: "Display", title: "Brighter, so you can scroll in the sun.", bg: "linear-gradient(160deg,#3b0b48,#000 70%)" },
  { kicker: "Battery", title: "All-day battery. For all-day screen time.", bg: "linear-gradient(160deg,#0b3d2e,#000 70%)" },
  { kicker: "Notifications", title: "Never miss a thing. Ever. Again.", bg: "linear-gradient(160deg,#08254d,#000 70%)" },
];

const euro = (n: number) => `€${n.toLocaleString("nl-NL")}`;

export default function ApplePage() {
  const router = useRouter();
  const [modelIdx, setModelIdx] = useState(0);
  const [finishIdx, setFinishIdx] = useState(0);
  const [spin, setSpin] = useState(0);
  const [bag, setBag] = useState<{ name: string; finish: string; price: number }[]>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [finale, setFinale] = useState<DOMRect | null | false>(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pageGone, setPageGone] = useState(false);

  const phoneRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const compareRef = useRef<HTMLElement>(null);
  const supportRef = useRef<HTMLElement>(null);

  const model = MODELS[modelIdx];
  const finish = model.finishes[Math.min(finishIdx, model.finishes.length - 1)];

  /* after a while: the store fades away and the phone takes over */
  useEffect(() => {
    router.prefetch(ROUTES.landing);
    const t = setTimeout(() => {
      setBagOpen(false);
      setFinale(phoneRef.current?.getBoundingClientRect() ?? null);
    }, TIMINGS.storeMs);
    // once the store has faded out, stop rendering it (keeps the finale smooth)
    const t2 = setTimeout(() => setPageGone(true), TIMINGS.storeMs + TIMINGS.finaleFadeMs + 100);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [router]);

  useEffect(() => {
    const onMove = (e: PointerEvent) =>
      setTilt({ x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 });
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
    setSpin((s) => s + 360);
  };

  const addToBag = (m: Model, f: Finish) => {
    setBag((b) => [...b, { name: m.name, finish: f.name, price: m.price }]);
    flash(`${m.name} – ${f.name} added to your bag`);
  };

  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: "smooth", block: "start" });
  const onFinaleDone = useCallback(() => router.replace(ROUTES.landing), [router]);

  const inFinale = finale !== false;

  return (
    <>
      <div
        className={`${styles.page} ${inFinale ? styles.pageFading : ""}`}
        style={{ transitionDuration: `${TIMINGS.finaleFadeMs}ms`, visibility: pageGone ? "hidden" : undefined }}
      >
        {/* ---------- nav ---------- */}
        <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
          <button className={styles.navLogo} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Home">
            <BrandImage src={BRAND.appleLogo} alt="" className={styles.navLogoImg} />
          </button>
          <button className={styles.navItem} onClick={() => scrollTo(compareRef.current)}>
            Store
          </button>
          <button className={styles.navItem} onClick={() => scrollTo(detailsRef.current)}>
            iPhone
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
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>New</p>
            <h1 className={styles.heroTitle}>{model.name}</h1>
            <p className={styles.heroTag}>{model.tagline}</p>
          </div>

          <div className={styles.stage}>
            <div className={styles.glow} />
            <div
              className={styles.phoneTilt}
              style={{
                transform: `rotateY(${tilt.x * 14 + spin}deg) rotateX(${-tilt.y * 8}deg)`,
                opacity: inFinale ? 0 : 1,
              }}
            >
              <div ref={phoneRef} className={styles.phoneFloat}>
                <PhoneFrame frame={finish.frame} style={{ "--pw": "clamp(150px, min(21vw, calc((100vh - 400px) / 2.07)), 290px)" } as CSSProperties}>
                  <LockScreen wallpaper={finish.wallpaper} />
                </PhoneFrame>
              </div>
            </div>
          </div>

          <div className={styles.modelTabs}>
            {MODELS.map((m, i) => (
              <button key={m.id} className={`${styles.modelTab} ${i === modelIdx ? styles.modelTabActive : ""}`} onClick={() => pickModel(i)}>
                {m.name}
              </button>
            ))}
          </div>
        </header>

        {/* ---------- selected model ---------- */}
        <section ref={detailsRef} className={styles.details} key={model.id}>
          <div className={styles.detailsLeft}>
            <p className={styles.eyebrow}>New</p>
            <h2 className={styles.detailsTitle}>{model.name}</h2>
            <p className={styles.tagline}>{model.tagline}</p>
            <div className={styles.finishes}>
              {model.finishes.map((f, i) => (
                <button
                  key={f.name}
                  className={`${styles.swatch} ${f === finish ? styles.swatchActive : ""}`}
                  style={{ background: f.frame }}
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
              <span className={styles.specIcon}>▯</span>
              {model.display}
            </li>
            <li>
              <span className={styles.specIcon}>◎</span>
              {model.camera}
            </li>
            <li>
              <span className={styles.specIcon}>⚡︎</span>
              {model.battery}
            </li>
            <li>
              <span className={styles.specIcon}>◇</span>
              {model.build}
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
          <h2 className={styles.sectionTitle}>Which iPhone is right for you?</h2>
          <div className={styles.compareGrid}>
            {MODELS.map((m, i) => (
              <div key={m.id} className={`${styles.compareCol} ${i === modelIdx ? styles.compareColActive : ""}`}>
                <div className={styles.compareSwatches}>
                  {m.finishes.map((f) => (
                    <span key={f.name} style={{ background: f.frame }} />
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
                  <li>{m.camera}</li>
                  <li>{m.battery}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- support / footer ---------- */}
        <footer ref={supportRef} className={styles.footer}>
          <div className={styles.footerCols}>
            {[
              ["Shop and Learn", "Store", "iPhone", "Accessories", "Gift Cards"],
              ["Support", "iPhone Support", "Repair", "Trade In", "Order Status"],
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

      {/* rendered outside the page so the fading page can't affect it */}
      {inFinale && <BrainrotFinale from={finale || null} frame={finish.frame} wallpaper={finish.wallpaper} onDone={onFinaleDone} />}
    </>
  );
}