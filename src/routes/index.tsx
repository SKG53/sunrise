import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { S07Map } from "../components/S07Map";
import {
  renderWordmark,
  render5mgLockup,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  getBasePx,
} from "../lib/sunrise-components";
import "./home.css";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "SUNRISE · Refresh the way the world drinks." },
      {
        name: "description",
        content:
          "Hemp-infused Delta-9 seltzer. Real fruit, pure cane sugar, clean lift — four potency tiers from easy to elevated, engineered for refreshment.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/" },
    ],
  }),
});

// ── FAQ DATA ─────────────────────────────────────────────────────────────
// Cold-traffic first-time-visitor questions (brand, category, legality,
// effect, risk, purchase). Intentionally disjoint from the SKU-specific
// FAQs on product detail pages — the two sets read as complementary.
const FAQS = [
  {
    q: "What is SUNRISE?",
    a: "A hemp-infused Delta-9 seltzer. Real fruit, pure cane sugar, and a precisely dosed THC lift in every can. Four potency tiers — 5mg, 10mg, 30mg, and 60mg — so you can pick the experience that fits the moment. Each can is two servings.",
  },
  {
    q: "Is hemp-derived Delta-9 THC legal?",
    a: "Yes. The 2018 Farm Bill made hemp-derived products federally legal at or below 0.3% Delta-9 THC by dry weight. SUNRISE is formulated to that spec and sold only in states whose laws permit it.",
  },
  {
    q: "What does it feel like?",
    a: "That's the point of having four tiers. 5mg is a light, easy lift — aperitif territory. 60mg is a full evening. Each step up is a deliberate choice, not a surprise. Effects are personal; start at 5mg or 10mg if it's your first time, and move up only when you know how your body responds.",
  },
  {
    q: "How is SUNRISE different from a CBD seltzer or a dispensary drink?",
    a: "CBD seltzers don't produce a noticeable lift — CBD is non-intoxicating. Dispensary drinks live inside state marijuana programs and can't travel outside the state that made them. SUNRISE is a federally compliant hemp beverage, which means it can sit on a standard retail shelf — grocery, liquor, bar, restaurant — the same way any other seltzer does.",
  },
  {
    q: "Will it show up on a drug test?",
    a: "Possibly. Standard drug panels test for THC metabolites and don't distinguish hemp-derived Delta-9 from any other source. If your job or situation requires a clean test, SUNRISE isn't for you.",
  },
  {
    q: "Where can I buy SUNRISE?",
    a: "Check the store locator on our Find page, or order directly through Shop. If your local spot doesn't carry it yet, tell them — retailer requests move faster than you'd think.",
  },
];

// ── S03 CAN REEL ─────────────────────────────────────────────────────────
// Continuously scrolling can strip. Rendered twice back-to-back for a
// seamless marquee loop. Order is interleaved 10mg / 60mg to avoid adjacent
// color repeats and to keep the wrap seam (last tile → first tile) visually
// distinct. Swap filenames or order here — no JSX changes required.
const S03_CANS = [
  { src: "/images/cans/SUNRISE__10MG_THC__Strawberry__Can_Mockup.webp",
    alt: "SUNRISE 10mg THC Strawberry hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__60MG_THC__Blueberry_Lemonade__Can_Mockup.webp",
    alt: "SUNRISE 60mg THC Blueberry Lemonade hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__10MG_THC__Watermelon__Can_Mockup.webp",
    alt: "SUNRISE 10mg THC Watermelon hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__60MG_THC__30MG_CBN__Blackberry__Can_Mockup.webp",
    alt: "SUNRISE 60mg THC +30mg CBN Blackberry hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__10MG_THC__Lemonade__Can_Mockup.webp",
    alt: "SUNRISE 10mg THC Lemonade hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__60MG_THC__Passionfruit_Mango__Can_Mockup.webp",
    alt: "SUNRISE 60mg THC Passionfruit Mango hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__60MG_THC__30MG_THCV__Strawberry_Kiwi__Can_Mockup.webp",
    alt: "SUNRISE 60mg THC +30mg THCV Strawberry Kiwi hemp-infused seltzer can" },
  { src: "/images/cans/SUNRISE__60MG_THC__30MG_CBG__Blood_Orange__Can_Mockup.webp",
    alt: "SUNRISE 60mg THC +30mg CBG Blood Orange hemp-infused seltzer can" },
];

// ── S02 BRAND STATEMENT LINES ────────────────────────────────────────────
// Each line is an inline SVG sized by a hardcoded natural-width viewBox,
// outer width: 100% of the stack. preserveAspectRatio="xMidYMid meet" makes
// every line fill the stack's width exactly, regardless of character count
// — perfect L/R alignment at every breakpoint with zero JS and no hydration
// flash. Widths calibrated once in Montserrat 900, fs=100, letter-spacing
// 0.01em. Only re-measure if the typeface, weight, letter-spacing, or the
// word set changes.
const S02_GRADIENT_STOPS: { o: number; c: string }[] = [
  { o: 0,      c: "#4F308D" },
  { o: 0.1667, c: "#822665" },
  { o: 0.3333, c: "#94264B" },
  { o: 0.5,    c: "#BF252D" },
  { o: 0.6667, c: "#CC382C" },
  { o: 0.8333, c: "#DC531F" },
  { o: 1,      c: "#E76B37" },
];

function S02Line({
  text,
  width,
  xShift,
  gradId,
  charOffset,
}: {
  text: string;
  width: number;
  xShift?: number;
  gradId: string;
  charOffset: number;
}) {
  const tx = xShift ?? 0;
  // Character-reveal typing animation: each character is a <tspan> with a
  // staggered animation-delay. Gradient still flows across the full <text>
  // element, so letters "arrive at their color" without gradient jank.
  // Stream is continuous across all four lines in reading order — charOffset
  // places this line's characters in the global sequence. Timing: 200ms
  // settle + 50ms/char stride + 0.05s snap. See .s02-char CSS in home.css.
  const SETTLE_MS = 200;
  const STRIDE_MS = 50;
  return (
    <svg
      className="s02-manifesto-line"
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          {S02_GRADIENT_STOPS.map((s) => (
            <stop key={s.o} offset={s.o} stopColor={s.c} />
          ))}
        </linearGradient>
      </defs>
      <text
        x={tx}
        y="82"
        fontFamily="Montserrat, sans-serif"
        fontWeight="900"
        fontSize="100"
        letterSpacing="1"
        fill={`url(#${gradId})`}
      >
        {text.split("").map((ch, i) => (
          <tspan
            key={i}
            className="s02-char"
            style={{ animationDelay: `${SETTLE_MS + (charOffset + i) * STRIDE_MS}ms` }}
          >
            {ch === " " ? "\u00A0" : ch}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

function HomePage() {
  const heroWmRef = useRef<HTMLDivElement>(null);
  const lockup5Ref = useRef<HTMLDivElement>(null);
  const lockup10Ref = useRef<HTMLDivElement>(null);
  const lockup30Ref = useRef<HTMLDivElement>(null);
  const lockup60Ref = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const [manifestoInView, setManifestoInView] = useState(false);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const lockupBase = window.innerWidth <= 520 ? 48 : 80;
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, "cream");
      if (lockup5Ref.current)  lockup5Ref.current.innerHTML  = render5mgLockup(lockupBase,  "#FEFBE0");
      if (lockup10Ref.current) lockup10Ref.current.innerHTML = render10mgLockup(lockupBase, "#FEFBE0");
      if (lockup30Ref.current) lockup30Ref.current.innerHTML = render30mgLockup(lockupBase, "#FEFBE0");
      if (lockup60Ref.current) lockup60Ref.current.innerHTML = render60mgLockup(lockupBase, "#FEFBE0");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  // S02 manifesto typewriter trigger. Animation fires when the stack is 15%
  // visible in the viewport. Observer disconnects on first fire — animation
  // plays exactly once per page load. If the stack is already in view on
  // mount (short hero, deep link, anchor), IntersectionObserver calls the
  // callback on initial check, so the animation still fires correctly.
  useEffect(() => {
    const el = manifestoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setManifestoInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SiteHeader activeNav="home" />

      <main>
        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="home-hero">
          <div className="hero-strip">
            <div className="hero-strip-col tier-5-bg" />
            <div className="hero-strip-col tier-10-bg" />
            <div className="hero-strip-col tier-30-bg" />
            <div className="hero-strip-col tier-60-bg" />
          </div>
          <div className="hero-overlay">
            <h1 className="sr-only">SUNRISE — Hemp-Infused Seltzers</h1>
            <div className="hero-wordmark-slot" ref={heroWmRef} />
            <div className="hero-subtitle">Crafted Beverages</div>
          </div>
        </section>

        {/* ── 02 · BRAND STATEMENT ──────────────────────────────────────── */}
        <section className="s02-brand-statement">
          <div className="container">
            <h2 className="sr-only">Refresh the way the world drinks.</h2>
            <div
              ref={manifestoRef}
              className={`s02-manifesto-stack${manifestoInView ? " in-view" : ""}`}
              aria-label="Refresh the way the world drinks."
            >
              <S02Line text="REFRESH"   width={488.41} xShift={-5.62} gradId="s02-grad-refresh" charOffset={0}  />
              <S02Line text="THE WAY"   width={514}                    gradId="s02-grad-theway"  charOffset={7}  />
              <S02Line text="THE WORLD" width={669.72}                 gradId="s02-grad-world"   charOffset={14} />
              <S02Line text="DRINKS"    width={410.96} xShift={-5.84} gradId="s02-grad-drinks"  charOffset={23} />
            </div>
          </div>
        </section>

        {/* ── 03 · PRODUCT INTRO ────────────────────────────────────────── */}
        {/* Centered copy inside the container, followed by an edge-to-edge   */}
        {/* continuously scrolling can strip pulled outside the container so  */}
        {/* cans run past the text column on both sides. Marquee renders      */}
        {/* S03_CANS twice back-to-back and animates translateX(0) →          */}
        {/* translateX(-50%) for a seamless loop. Hover pauses;               */}
        {/* prefers-reduced-motion disables animation.                        */}
        <section className="s03-product-intro">
          <div className="container">
            <h2 className="s03-pi-headline">
              Infused Seltzers<br />
              Made with <span className="accent">real fruit</span>
            </h2>
            <p className="s03-pi-subhead">
              Clean, carbonated, and crafted to showcase real fruit character.
              Federally-legal Delta-9 THC, emulsified for precise dosing — so every
              can delivers exactly the experience you chose.
            </p>
          </div>
          <div className="s03-reel" aria-label="SUNRISE can lineup">
            <div className="s03-reel-track">
              {[...S03_CANS, ...S03_CANS].map((can, idx) => (
                <div
                  key={idx}
                  className="s03-reel-tile"
                  aria-hidden={idx >= S03_CANS.length ? "true" : undefined}
                >
                  <img src={can.src} alt={can.alt} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 04 · FOUR TIERS ───────────────────────────────────────────── */}
        <section className="s06-tiers">
          <div className="container">
            <h2 className="s06-headline">
              Four options<br />
              Find your <span className="accent">perfect dose</span>
            </h2>
            <p className="s06-subhead">
              Mellow moments to enhanced relaxation, find your favorite SUNRISE experience below.
            </p>
            <div className="s06-grid">
              <a href="/products?tier=5" className="s06-card t5">
                <div className="s06-lockup-slot" ref={lockup5Ref} />
                <div className="s06-card-meta">
                  <div className="s06-card-name">Subtle<br />Lift</div>
                  <div className="s06-card-descriptor">Light · Bright</div>
                  <div className="s06-card-occasion">
                    First times, mid-week refreshments, or social sessions.
                  </div>
                </div>
                <div className="s06-card-footer"><span className="s06-card-footer-label">Explore</span><span className="s06-card-footer-arrow">→</span></div>
              </a>
              <a href="/products?tier=10" className="s06-card t10">
                <div className="s06-lockup-slot" ref={lockup10Ref} />
                <div className="s06-card-meta">
                  <div className="s06-card-name">Perfect<br />Buzz</div>
                  <div className="s06-card-descriptor">Smooth · Social</div>
                  <div className="s06-card-occasion">
                    Casual sips, afternoon resets, or social gatherings.
                  </div>
                </div>
                <div className="s06-card-footer"><span className="s06-card-footer-label">Explore</span><span className="s06-card-footer-arrow">→</span></div>
              </a>
              <a href="/products?tier=30" className="s06-card t30">
                <div className="s06-lockup-slot" ref={lockup30Ref} />
                <div className="s06-card-meta">
                  <div className="s06-card-name">Deeper<br />Dive</div>
                  <div className="s06-card-descriptor">Rich · Vibrant</div>
                  <div className="s06-card-occasion">
                    Extended sessions, creative inspirations, or evening unwinds.
                  </div>
                </div>
                <div className="s06-card-footer"><span className="s06-card-footer-label">Explore</span><span className="s06-card-footer-arrow">→</span></div>
              </a>
              <a href="/products?tier=60" className="s06-card t60">
                <div className="s06-lockup-slot" ref={lockup60Ref} />
                <div className="s06-card-meta">
                  <div className="s06-card-name">Elevated<br />Experience</div>
                  <div className="s06-card-descriptor">Bold · Immersive</div>
                  <div className="s06-card-occasion">
                    Late nights, deep decompressions, or weekend relaxation.
                  </div>
                </div>
                <div className="s06-card-footer"><span className="s06-card-footer-label">Explore</span><span className="s06-card-footer-arrow">→</span></div>
              </a>
            </div>
          </div>
        </section>

        {/* ── 05 · WHAT'S INSIDE ────────────────────────────────────────── */}
        <section id="whats-inside" className="s04-whats-inside">
          <div className="container">
            <h2 className="s04-headline">
              What's Inside<br />
              <span className="accent">Each can?</span>
            </h2>
            <div className="s04-trifecta">
              <div className="s04-col s04-col-left">
                <div className="s04-ing">
                  <div className="s04-ing-name">Purified<br />Water</div>
                  <div className="s04-ing-desc">
                    Reverse-osmosis filtered water carefully chosen for exceptional
                    hydration &amp; uncompromising flavor.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Pure Cane<br />Sugar</div>
                  <div className="s04-ing-desc">
                    A touch of real sugar for smooth, naturally derived sweetness.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Natural<br />Flavoring</div>
                  <div className="s04-ing-desc">
                    Sourced from real fruits and botanicals, our flavors deliver
                    bright, authentic notes true to their names.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Fresh Lemon<br />Juice</div>
                  <div className="s04-ing-desc">
                    Used exclusively in our Lemonade flavors, this ingredient brings
                    a hint of crisp acidity with a natural citrus lift.
                  </div>
                </div>
              </div>
              <div className="s04-center">
                <img
                  className="s04-can"
                  src="/images/cans/SUNRISE__10MG_THC__Lemonade__Can_Mockup.webp"
                  alt="SUNRISE 10mg THC Lemonade hemp-infused seltzer can"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="s04-col s04-col-right">
                <div className="s04-ing">
                  <div className="s04-ing-name">Emulsified Hemp Extract</div>
                  <div className="s04-ing-desc">
                    The good stuff — expertly blended cannabis extract for a clean
                    and consistent experience with every sip.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Naturally Sourced Enhancers</div>
                  <div className="s04-ing-desc">
                    Functional ingredients like B12 that allow for a healthier,
                    more balanced experience without altering flavors.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Citric Acid</div>
                  <div className="s04-ing-desc">
                    A naturally occurring acid found in citrus fruits, this is used
                    to balance flavors and keep things bubbly.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Sodium Benzoate</div>
                  <div className="s04-ing-desc">
                    A widely used food-safe preservative that helps keep each can
                    fresh without altering its flavor profile.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · STORY TEASER ─────────────────────────────────────────── */}
        <section className="s07-story">
          <div className="container">
            <div className="s07-layout">
              <div className="s07-portrait" />
              <div className="s07-copy">
                <h2 className="s07-headline">
                  A family business<br />A new kind of drink
                </h2>
                <p className="s07-body">
                  SUNRISE was born from a simple conviction: the world of non-alcoholic
                  drinks was due for a reinvention. Our team brings decades of beverage
                  manufacturing to the problem, and every can reflects that work.
                </p>
                <div className="s07-cta-row">
                  <a href="/about" className="btn btn-on-color-ghost">Read Our Story →</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 07 · NEAR YOU TEASER ──────────────────────────────────────── */}
        <section className="s08-near-you">
          <div className="s08-inner">
            <S07Map />
            <div className="s08-card">
              <h2 className="s08-card-headline">
                Find SUNRISE<br />near you
              </h2>
              <p className="s08-card-body">
                Available at select retailers across the country. Check the locator
                to find your nearest store.
              </p>
              <div>
                <a href="/find" className="btn btn-primary">Find Near You →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 08 · REVIEWS ──────────────────────────────────────────────── */}
        {/* Continuous right-to-left marquee. Track is duplicated (6 cards */}
        {/* × 2) to produce a seamless loop via translateX(0 → -50%).     */}
        {/* Hover pauses. All quote content is placeholder.                */}
        <section className="s09-reviews">
          <h2 className="s09-heading">What people say</h2>
          <div className="s09-marquee" aria-label="Customer reviews carousel">
            <div className="s09-marquee-track">
              {/* Set A */}
              <div className="s09-card">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Smoother than any edible I've had. Finally something that actually
                  tastes like a drink.
                </div>
                <div className="s09-attribution">— James K., Austin, TX</div>
              </div>
              <div className="s09-card">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  The 10mg is my Friday night wind-down. Strawberry is unreal.
                </div>
                <div className="s09-attribution">— Priya S., Denver, CO</div>
              </div>
              <div className="s09-card">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Most of these drinks taste like medicine. This one doesn't.
                </div>
                <div className="s09-attribution">— Marcus D., Nashville, TN</div>
              </div>
              <div className="s09-card">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Beautifully carbonated, actually fruit-forward. A rare combination.
                </div>
                <div className="s09-attribution">— Lauren H., Portland, OR</div>
              </div>
              <div className="s09-card">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Found these at my local shop and now they're at every gathering
                  I host.
                </div>
                <div className="s09-attribution">— Dan R., Kansas City, MO</div>
              </div>
              <div className="s09-card">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  The Blood Orange 60mg is a perfect evening. Exactly the experience
                  I chose.
                </div>
                <div className="s09-attribution">— Emma T., Phoenix, AZ</div>
              </div>
              {/* Set B — duplicate for seamless loop. aria-hidden to avoid SR double-read. */}
              <div className="s09-card" aria-hidden="true">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Smoother than any edible I've had. Finally something that actually
                  tastes like a drink.
                </div>
                <div className="s09-attribution">— James K., Austin, TX</div>
              </div>
              <div className="s09-card" aria-hidden="true">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  The 10mg is my Friday night wind-down. Strawberry is unreal.
                </div>
                <div className="s09-attribution">— Priya S., Denver, CO</div>
              </div>
              <div className="s09-card" aria-hidden="true">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Most of these drinks taste like medicine. This one doesn't.
                </div>
                <div className="s09-attribution">— Marcus D., Nashville, TN</div>
              </div>
              <div className="s09-card" aria-hidden="true">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Beautifully carbonated, actually fruit-forward. A rare combination.
                </div>
                <div className="s09-attribution">— Lauren H., Portland, OR</div>
              </div>
              <div className="s09-card" aria-hidden="true">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  Found these at my local shop and now they're at every gathering
                  I host.
                </div>
                <div className="s09-attribution">— Dan R., Kansas City, MO</div>
              </div>
              <div className="s09-card" aria-hidden="true">
                <div className="s09-quote-mark">"</div>
                <div className="s09-quote-text">
                  The Blood Orange 60mg is a perfect evening. Exactly the experience
                  I chose.
                </div>
                <div className="s09-attribution">— Emma T., Phoenix, AZ</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 09 · FAQ ──────────────────────────────────────────────────── */}
        {/* Home-level FAQ. Broader than Product Detail — first-time-visitor */}
        {/* questions (brand, legality, effect, category, risk, purchase).  */}
        {/* SKU-specific questions (dose, onset, variants, COAs) stay on    */}
        {/* Product Detail. Visual pattern mirrors .pd-faq so the two feel  */}
        {/* like family. Class prefix s10-faq-* to avoid collision with the */}
        {/* existing s09-reviews block above.                               */}
        <section className="s10-faq">
          <div className="container">
            <div className="s10-faq-head">
              <div className="s10-faq-eyebrow">Questions</div>
              <h2 className="s10-faq-headline">
                The questions we hear <span className="accent">most</span>
              </h2>
            </div>
            <div className="s10-faq-list">
              {FAQS.map((item, idx) => (
                <details key={idx} className="s10-faq-item">
                  <summary className="s10-faq-q">
                    <span>{item.q}</span>
                    <span className="s10-faq-chev" aria-hidden="true">+</span>
                  </summary>
                  <div className="s10-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
