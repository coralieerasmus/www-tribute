"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/experience";
import { AppsIcon, GoogleLogo, LaptopThumb, LensIcon, MicIcon, isValidQuery } from "./shared";
import styles from "./google.module.css";

/* Every link on this page goes to the same place. */
const NEXT = ROUTES.apple;

const capsules = (colors: string[]) =>
  `repeating-linear-gradient(90deg, ${colors
    .map((c, i) => `${c} ${i * 10}px, ${c} ${i * 10 + 7}px, transparent ${i * 10 + 7}px, transparent ${(i + 1) * 10}px`)
    .join(", ")}), linear-gradient(#f6f6f6, #f6f6f6)`;

const PRODUCTS = [
  { title: "Apple MacBook Neo (2026) A18 Pro 256GB Blush", price: "€799.00", store: "Coolblue", ship: "Free", stars: "(6k+)", screen: capsules(["#ff4fa3", "#ff8fcf", "#ffc2e8"]) },
  { title: "Apple 13 Inch Macbook Neo (2026) - 13 Inch, 256GB", price: "€799.00", store: "MediaMarkt", local: true, pickup: "Pick up tomorrow", stars: "(6k+)", screen: capsules(["#1e6bff", "#46b6ff", "#9be3ff"]) },
  { title: "Macbook Pro 16\" - Intel i7 2,6GHz - 16GB Ram - Space Gray", price: "€499.00", store: "RefurbishedDirect", ship: "Free", refurb: true, screen: "linear-gradient(135deg,#0b2a6f,#1b0f3b 60%,#000)", keyboard: true },
  { title: "Apple Macbook Air (2026) - 13 Inch M5 (10-core) 16GB", price: "€1,429.00", store: "MediaMarkt.nl", ship: "Free", stars: "(3k+)", screen: "radial-gradient(circle at 30% 70%, #4aa3ff, #0a2a7a 55%, #020a26)" },
  { title: "Apple MacBook Pro 2020 | 13.3\" | Touch Bar", price: "€479.00", store: "refurbed.nl", ship: "Free", refurb: true, screen: "linear-gradient(120deg,#1b2a6b,#b0174a 55%,#ff5a2a)" },
  { title: "Apple MacBook Neo (2026) A18 Pro 256GB Citrus", price: "€799.00", store: "Coolblue", local: true, pickup: "Pick up today", stars: "(6k+)", screen: capsules(["#c3e600", "#f2f200", "#7fd400"]) },
  { title: "Samsung Galaxy Book4 Edge Copilot+ PC 15,6\"", price: "€699.00", was: "€999", store: "Coolblue.nl", ship: "Free", rating: "Store rating 4.2/5", sale: true, screen: "radial-gradient(circle at 60% 40%, #9fd3ff, #4b7bd8 60%, #2a3f8f)", base: "#c9d3e3" },
  { title: "Apple MacBook Neo - 13 inch - Citrus - 256 GB", price: "€730.00", store: "bol.com", ship: "Free", stars: "(6k+)", screen: capsules(["#d4f000", "#a8e000", "#f5ff6a"]) },
  { title: "Apple MacBook Air 15\" (2026) M5 Midnight 512GB", price: "€1,649.00", store: "Amac", ship: "Free", stars: "(2k+)", screen: "linear-gradient(160deg,#0d1b3d,#2c4a9b 50%,#79b4ff)" },
  { title: "Apple MacBook Pro 14\" M5 Pro 24GB Space Black", price: "€2,399.00", store: "Coolblue", ship: "Free", stars: "(1k+)", screen: "linear-gradient(200deg,#000,#3a1a6b 50%,#ff6a3d)" },
];

const RESULTS = [
  {
    site: "Apple",
    url: "https://www.apple.com › nl › mac",
    title: "Mac - Apple (NL)",
    snippet: (
      <>
        De krachtigste Mac-laptops en -desktops ooit. Met de superkracht van Apple silicon. <b>MacBook Neo</b>, <b>MacBook Air</b>,{" "}
        <b>MacBook Pro</b>, iMac, Mac mini, Mac Studio en Mac Pro.
      </>
    ),
  },
  {
    site: "Apple",
    url: "https://www.apple.com › macbook-pro",
    translate: true,
    title: "MacBook Pro",
    snippet: (
      <>
        Vind de <b>MacBook Pro</b> met M5-, M5 Pro- of M5 Max-chip die bij jou past. Gemaakt voor AI. Tot wel 24 uur batterijduur. Liquid Retina XDR-display.
      </>
    ),
    extra: "Free delivery · 14-day returns",
  },
  {
    site: "Coolblue",
    url: "https://www.coolblue.nl › laptops › apple-macbooks",
    title: "Apple MacBooks vergelijken en kopen",
    snippet: <>Alle <b>Apple laptops</b> op een rij. Vergelijk MacBook Neo, Air en Pro en lees reviews van andere klanten. Vandaag besteld, morgen in huis.</>,
    rating: "4.6 · 12,408 reviews",
  },
  {
    site: "MediaMarkt",
    url: "https://www.mediamarkt.nl › computer › apple-macbook",
    title: "Apple MacBook kopen? | MediaMarkt",
    snippet: <>Bekijk ons aanbod <b>Apple laptops</b>. Haal je nieuwe MacBook vandaag nog op in een winkel bij jou in de buurt, ook in Eindhoven.</>,
  },
  {
    site: "Tweakers",
    url: "https://tweakers.net › pricewatch › apple-laptops",
    title: "Apple laptops - Pricewatch - Tweakers",
    snippet: <>Vergelijk prijzen van <b>Apple laptops</b> bij tientallen webshops. Bekijk specificaties, prijsgeschiedenis en ervaringen van gebruikers.</>,
  },
  {
    site: "Wikipedia",
    url: "https://en.wikipedia.org › wiki › MacBook",
    title: "MacBook - Wikipedia",
    snippet: <>The <b>MacBook</b> is a brand of Mac notebook computers designed and marketed by Apple that use Apple&apos;s macOS operating system.</>,
  },
];

const QUESTIONS = [
  { q: "Which Apple laptop is best for students?", a: "For most students the cheapest current model is plenty for notes, browsing and streaming. If you edit video or code a lot, an Air or Pro with more memory will last longer." },
  { q: "Is it worth upgrading an old laptop?", a: "If your laptop struggles with video calls, takes ages to start up, or lags when you have a few tabs open, an upgrade will feel like a huge difference." },
  { q: "What is the cheapest MacBook right now?", a: "The entry-level MacBook is the cheapest new model. Refurbished older models can be cheaper, but they get software updates for fewer years." },
  { q: "How long does a MacBook last?", a: "Many people use a MacBook for five to seven years before it starts to feel slow, depending on how heavily it's used." },
];

export default function GoogleResults() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "apple laptops";
  const [q, setQ] = useState(initial);
  const [wrong, setWrong] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);

  useEffect(() => {
    router.prefetch(NEXT);
  }, [router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidQuery(q)) {
      setWrong((w) => w + 1);
      return;
    }
    router.push(`${ROUTES.googleSearch}?q=${encodeURIComponent(q.trim())}`);
  };

  const scroll = (dir: 1 | -1) => {
    const el = carousel.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={styles.resultsPage}>
      <header className={styles.resultsHeader}>
        <Link href={ROUTES.google} className={styles.resultsLogo} aria-label="Google home">
          <GoogleLogo small />
        </Link>
        <form className={`${styles.resultsSearch} ${wrong ? styles.shake : ""}`} key={wrong} onSubmit={submit}>
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" autoComplete="off" spellCheck={false} />
          {q && (
            <button type="button" className={styles.clearBtn} onClick={() => setQ("")} aria-label="Clear">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6L6 18" stroke="#202124" strokeWidth="2.2" />
              </svg>
            </button>
          )}
          <span className={styles.searchDivider} />
          <button type="button" className={styles.iconBtn} aria-label="Search by voice">
            <MicIcon />
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Search by image">
            <LensIcon />
          </button>
        </form>
        <div className={styles.resultsTopRight}>
          <button className={styles.iconBtn} aria-label="Share">
            <svg width="22" height="22" viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="2.6" fill="#5f6368" />
              <circle cx="6" cy="12" r="2.6" fill="#5f6368" />
              <circle cx="18" cy="19" r="2.6" fill="#5f6368" />
              <path d="M8 11l8-5M8 13l8 5" stroke="#5f6368" strokeWidth="1.8" />
            </svg>
          </button>
          <button className={styles.iconBtn} aria-label="Google apps">
            <AppsIcon />
          </button>
          <div className={styles.avatarPhoto} />
        </div>
      </header>

      <nav className={styles.tabs}>
        {["AI Mode", "All", "Images", "News", "Videos", "Short videos", "Forums"].map((t) => (
          <span key={t} className={t === "All" ? styles.tabActive : styles.tab}>
            {t}
          </span>
        ))}
        <span className={styles.tab}>More ▾</span>
        <span className={styles.tab}>Tools ▾</span>
      </nav>
      <div className={styles.chips}>
        <span className={styles.chip}>Reviews</span>
      </div>

      <div className={styles.resultsBody}>
        <div className={styles.resultsMain}>
          <div className={styles.location}>
            <span className={styles.blueDot} />
            <b>5617 BC Eindhoven</b> · <span className={styles.blueLink}>Choose area</span>
            <span className={styles.kebab}>⋮</span>
          </div>

          <h2 className={styles.sponsoredTitle}>
            Sponsored Products <span className={styles.kebab}>⋮</span>
          </h2>

          <div className={styles.carouselWrap}>
            {canLeft && (
              <button className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`} onClick={() => scroll(-1)} aria-label="Previous">
                ‹
              </button>
            )}
            <div className={styles.carousel} ref={carousel} onScroll={(e) => setCanLeft(e.currentTarget.scrollLeft > 10)}>
              {PRODUCTS.map((p) => (
                <Link key={p.title} href={NEXT} className={styles.product}>
                  <div className={styles.productImg}>
                    {p.sale && <span className={styles.sale}>SALE</span>}
                    <LaptopThumb screen={p.screen} base={p.base} keyboard={p.keyboard} />
                  </div>
                  {p.local && <span className={styles.localTag}>⚲ Eindhoven</span>}
                  <div className={styles.productTitle}>{p.title}</div>
                  <div className={styles.productPrice}>
                    <span className={p.was ? styles.priceSale : undefined}>{p.price}</span>
                    {p.was && <s>{p.was}</s>}
                  </div>
                  <div className={styles.productStore}>{p.store}</div>
                  {p.refurb && <div className={styles.productGrey}>Refurbished</div>}
                  {p.ship && <div className={styles.productGrey}>🚚 {p.ship}</div>}
                  {p.pickup && <div className={styles.productGrey}>⚲ {p.pickup}</div>}
                  {p.stars && (
                    <div className={styles.productGrey}>
                      <span className={styles.stars}>★★★★★</span> {p.stars}
                    </div>
                  )}
                  {p.rating && <div className={styles.productGrey}>{p.rating}</div>}
                  <div className={styles.byLine}>By Channable</div>
                </Link>
              ))}
            </div>
            <button className={styles.carouselArrow} onClick={() => scroll(1)} aria-label="Next">
              ›
            </button>
          </div>

          <div className={styles.lower}>
            <div className={styles.lowerMain}>
          <div className={styles.organic}>
            {RESULTS.slice(0, 2).map((r) => (
              <Result key={r.title} {...r} />
            ))}

            <div className={styles.paa}>
              <h3>People also ask</h3>
              {QUESTIONS.map((x, i) => (
                <div key={x.q} className={styles.paaItem}>
                  <button className={styles.paaQ} onClick={() => setOpen(open === i ? null : i)}>
                    {x.q}
                    <span className={`${styles.paaChevron} ${open === i ? styles.paaChevronOpen : ""}`}>⌄</span>
                  </button>
                  {open === i && (
                    <div className={styles.paaA}>
                      <p>{x.a}</p>
                      <Link href={NEXT} className={styles.resultTitle}>
                        Learn more about Mac laptops
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {RESULTS.slice(2).map((r) => (
              <Result key={r.title} {...r} />
            ))}
          </div>

          <div className={styles.pagination}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) =>
              n === 1 ? (
                <span key={n} className={styles.pageCurrent}>
                  {n}
                </span>
              ) : (
                <Link key={n} href={NEXT}>
                  {n}
                </Link>
              ),
            )}
            <Link href={NEXT} className={styles.pageNext}>
              Next
            </Link>
          </div>
            </div>
            <aside className={styles.sidePanel}>
              <h3>From Amac Apple Premium Reseller</h3>
              <p>
                &ldquo;Amac: dé Apple expert bij jou in de buurt met 50 winkels verspreid door Nederland. Als Apple Premium Reseller en Apple Authorised Service
                Provider bieden wij naast een zeer uitgebreid assortiment ook…{" "}
                <Link href={NEXT} className={styles.blueLink}>
                  More
                </Link>
              </p>
              <h3 className={styles.sidePanelSecond}>Updates from Amac Apple Premium Re…</h3>
              <Link href={NEXT} className={styles.blueLink}>
                View previous updates on Google
              </Link>
              <div className={styles.sideCards}>
                {["Back to school deals", "New: MacBook Neo in store", "Trade in your old laptop"].map((t, i) => (
                  <Link key={t} href={NEXT} className={styles.sideCard}>
                    <LaptopThumb screen={PRODUCTS[[0, 5, 2][i]].screen} keyboard={i === 2} />
                    <span>{t}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Result({
  site,
  url,
  title,
  snippet,
  extra,
  rating,
  translate,
}: {
  site: string;
  url: string;
  title: string;
  snippet: ReactNode;
  extra?: string;
  rating?: string;
  translate?: boolean;
}) {
  return (
    <div className={styles.result}>
      <Link href={NEXT} className={styles.resultHead}>
        <span className={styles.favicon}>{site.charAt(0)}</span>
        <span>
          <span className={styles.site}>{site}</span>
          <span className={styles.url}>
            {url}
            {translate && <span className={styles.translate}> · Translate this page</span>}
          </span>
        </span>
        <span className={styles.kebab}>⋮</span>
      </Link>
      <Link href={NEXT} className={styles.resultTitle}>
        {title}
      </Link>
      <div className={styles.snippet}>{snippet}</div>
      {rating && <div className={styles.extra}><span className={styles.stars}>★★★★★</span> {rating}</div>}
      {extra && <div className={styles.extra}>{extra}</div>}
    </div>
  );
}
