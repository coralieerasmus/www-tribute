"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/experience";
import { AppsIcon, GoogleLogo, LensIcon, MicIcon, PhoneThumb, isValidQuery } from "./shared";
import styles from "./google.module.css";

/* Every link on this page goes to the same place. */
const NEXT = ROUTES.apple;

const capsules = (colors: string[]) =>
  `repeating-linear-gradient(90deg, ${colors
    .map((c, i) => `${c} ${i * 10}px, ${c} ${i * 10 + 7}px, transparent ${i * 10 + 7}px, transparent ${(i + 1) * 10}px`)
    .join(", ")}), linear-gradient(#f6f6f6, #f6f6f6)`;

const PRODUCTS = [
  { title: "Apple iPhone 18 Pro 256GB Cosmic Orange", price: "€1,329.00", store: "Coolblue", ship: "Free", stars: "(6k+)", screen: "linear-gradient(160deg,#ff8a3d,#c2410c 60%,#431407)", frame: "#d9733a", back: true },
  { title: "Apple iPhone 18 256GB Lavender", price: "€969.00", store: "MediaMarkt", local: true, pickup: "Pick up tomorrow", stars: "(6k+)", screen: "radial-gradient(circle at 30% 30%,#e9d5ff,#a78bfa 55%,#4c1d95)", frame: "#c4b5fd" },
  { title: "iPhone 13 128GB Midnight - Refurbished - Excellent", price: "€349.00", store: "RefurbishedDirect", ship: "Free", refurb: true, screen: "linear-gradient(160deg,#1e293b,#0f172a)", frame: "#1f2937" },
  { title: "Apple iPhone 18 Air 256GB Sky Blue", price: "€1,229.00", store: "MediaMarkt.nl", ship: "Free", stars: "(3k+)", screen: "radial-gradient(circle at 70% 20%,#e0f2fe,#7dd3fc 50%,#0369a1)", frame: "#bae6fd" },
  { title: "Apple iPhone 15 128GB Black | Refurbished", price: "€479.00", store: "refurbed.nl", ship: "Free", refurb: true, screen: "linear-gradient(120deg,#1b2a6b,#b0174a 55%,#ff5a2a)", frame: "#111" },
  { title: "Apple iPhone 18 Pro Max 512GB Deep Blue", price: "€1,749.00", store: "Coolblue", local: true, pickup: "Pick up today", stars: "(6k+)", screen: "linear-gradient(160deg,#1e3a8a,#172554)", frame: "#1e3a8a", back: true },
  { title: "Samsung Galaxy S26 256GB Phantom Black", price: "€899.00", was: "€1,099", store: "Coolblue.nl", ship: "Free", rating: "Store rating 4.2/5", sale: true, screen: "radial-gradient(circle at 60% 40%,#9fd3ff,#4b7bd8 60%,#2a3f8f)", frame: "#2b2b2b" },
  { title: "Apple iPhone 18 256GB Sage", price: "€949.00", store: "bol.com", ship: "Free", stars: "(6k+)", screen: "radial-gradient(circle at 30% 70%,#d9f99d,#84cc16 55%,#365314)", frame: "#bcd4a8" },
  { title: "Apple iPhone 18e 128GB White", price: "€699.00", store: "Amac", ship: "Free", stars: "(2k+)", screen: "linear-gradient(160deg,#f1f5f9,#cbd5e1)", frame: "#e5e7eb" },
  { title: "Apple iPhone 18 Air 512GB Space Black", price: "€1,479.00", store: "Coolblue", ship: "Free", stars: "(1k+)", screen: "linear-gradient(200deg,#000,#3a1a6b 50%,#ff6a3d)", frame: "#111" },
];

const RESULTS = [
  {
    site: "Apple",
    url: "https://www.apple.com › nl › iphone",
    title: "iPhone - Apple (NL)",
    snippet: (
      <>
        Ontdek de nieuwste <b>iPhone</b>-modellen, waaronder <b>iPhone 18 Pro</b>, <b>iPhone 18 Air</b> en <b>iPhone 18</b>. Vergelijk modellen, bekijk
        kleuren en kies de iPhone die bij jou past.
      </>
    ),
  },
  {
    site: "Apple",
    url: "https://www.apple.com › iphone-18-pro",
    translate: true,
    title: "iPhone 18 Pro",
    snippet: (
      <>
        De krachtigste <b>iPhone</b> ooit. Pro-camerasysteem, een display dat nog helderder is en batterijduur voor de hele dag. Gemaakt voor AI.
      </>
    ),
    extra: "Free delivery · 14-day returns",
  },
  {
    site: "Coolblue",
    url: "https://www.coolblue.nl › mobiele-telefoons › apple-iphone",
    title: "Apple iPhone vergelijken en kopen",
    snippet: <>Alle <b>Apple iPhones</b> op een rij. Vergelijk iPhone 18, Air en Pro en lees reviews van andere klanten. Vandaag besteld, morgen in huis.</>,
    rating: "4.6 · 12,408 reviews",
  },
  {
    site: "MediaMarkt",
    url: "https://www.mediamarkt.nl › telefonie › apple-iphone",
    title: "Apple iPhone kopen? | MediaMarkt",
    snippet: <>Bekijk ons aanbod <b>Apple iPhones</b>. Haal je nieuwe iPhone vandaag nog op in een winkel bij jou in de buurt, ook in Eindhoven.</>,
  },
  {
    site: "Tweakers",
    url: "https://tweakers.net › pricewatch › apple-iphone",
    title: "Apple iPhone - Pricewatch - Tweakers",
    snippet: <>Vergelijk prijzen van <b>Apple iPhones</b> bij tientallen webshops. Bekijk specificaties, prijsgeschiedenis en ervaringen van gebruikers.</>,
  },
  {
    site: "Wikipedia",
    url: "https://en.wikipedia.org › wiki › IPhone",
    title: "iPhone - Wikipedia",
    snippet: <>The <b>iPhone</b> is a line of smartphones designed and marketed by Apple that use Apple&apos;s iOS mobile operating system.</>,
  },
];

const QUESTIONS = [
  { q: "Which iPhone should I buy?", a: "For most people the standard model is plenty for photos, socials and streaming. If you care about the camera or battery life, the Pro models last longer." },
  { q: "Is it worth upgrading an old phone?", a: "If your phone lags on video calls, runs out of storage or dies before the end of the day, an upgrade will feel like a huge difference." },
  { q: "What is the cheapest iPhone right now?", a: "The entry-level iPhone is the cheapest new model. Refurbished older models can be cheaper, but they get software updates for fewer years." },
  { q: "How long does an iPhone last?", a: "Many people use an iPhone for four to six years before it starts to feel slow, depending on how heavily it's used." },
];

export default function GoogleResults() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "apple iphone";
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
                    <PhoneThumb screen={p.screen} frame={p.frame} back={p.back} />
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
                        Learn more about iPhone
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
                {["Back to school deals", "New: iPhone 18 Pro in store", "Trade in your old phone"].map((t, i) => (
                  <Link key={t} href={NEXT} className={styles.sideCard}>
                    <PhoneThumb screen={PRODUCTS[[1, 3, 2][i]].screen} frame={PRODUCTS[[1, 3, 2][i]].frame} />
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