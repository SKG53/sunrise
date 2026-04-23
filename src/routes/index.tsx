import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
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

// ── LIFESTYLE REEL ────────────────────────────────────────────────────────
// Rendered twice back-to-back to produce a seamless marquee loop.
const IMAGES = [
  { src: "/reel-1.jpg", alt: "SUNRISE lifestyle moment 1" },
  { src: "/reel-2.jpg", alt: "SUNRISE lifestyle moment 2" },
  { src: "/reel-3.jpg", alt: "SUNRISE lifestyle moment 3" },
  { src: "/reel-4.jpg", alt: "SUNRISE lifestyle moment 4" },
  { src: "/reel-5.jpg", alt: "SUNRISE lifestyle moment 5" },
  { src: "/reel-6.jpg", alt: "SUNRISE lifestyle moment 6" },
  { src: "/reel-7.jpg", alt: "SUNRISE lifestyle moment 7" },
  { src: "/reel-8.jpg", alt: "SUNRISE lifestyle moment 8" },
];

function HomePage() {
  const heroWmRef = useRef<HTMLDivElement>(null);
  const lockup5Ref = useRef<HTMLDivElement>(null);
  const lockup10Ref = useRef<HTMLDivElement>(null);
  const lockup30Ref = useRef<HTMLDivElement>(null);
  const lockup60Ref = useRef<HTMLDivElement>(null);
  const s02StackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const justifyS02 = () => {
      const stack = s02StackRef.current;
      if (!stack) return;
      const target = stack.getBoundingClientRect().width;
      if (target === 0) return;
      const lines = stack.querySelectorAll<HTMLDivElement>(".s02-manifesto-line");
      lines.forEach((line) => {
        // Pass 1: measure natural width at a reference size, scale so rendered
        // width ≈ stack width.
        line.style.fontSize = "100px";
        const natural = line.getBoundingClientRect().width;
        if (natural === 0) return;
        const firstPass = (100 * target) / natural;
        line.style.fontSize = firstPass + "px";
        // Pass 2: remeasure at the computed size. Letter glyphs scale linearly
        // with fontSize, but space-character widths include word-spacing
        // metrics that round non-linearly — so lines with more spaces drift
        // slightly from target width after pass 1. A single correction pass
        // drives the rendered width to within sub-pixel of target regardless
        // of how many spaces the line contains.
        const actual = line.getBoundingClientRect().width;
        if (actual > 0 && Math.abs(actual - target) > 0.5) {
          line.style.fontSize = (firstPass * target) / actual + "px";
        }
      });
    };
    const paint = () => {
      const base = getBasePx();
      const lockupBase = window.innerWidth <= 520 ? 48 : 80;
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, "cream");
      if (lockup5Ref.current)  lockup5Ref.current.innerHTML  = render5mgLockup(lockupBase,  "#FEFBE0");
      if (lockup10Ref.current) lockup10Ref.current.innerHTML = render10mgLockup(lockupBase, "#FEFBE0");
      if (lockup30Ref.current) lockup30Ref.current.innerHTML = render30mgLockup(lockupBase, "#FEFBE0");
      if (lockup60Ref.current) lockup60Ref.current.innerHTML = render60mgLockup(lockupBase, "#FEFBE0");
      justifyS02();
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
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
            <div className="s02-manifesto-stack" ref={s02StackRef}>
              <div className="s02-manifesto-line s02-ml-refresh">Refresh</div>
              <div className="s02-manifesto-line s02-ml-theway">The Way</div>
              <div className="s02-manifesto-line s02-ml-world">The World</div>
              <div className="s02-manifesto-line s02-ml-drinks">Drinks</div>
            </div>
          </div>
        </section>

        {/* ── 03 · PRODUCT INTRO ────────────────────────────────────────── */}
        <section className="s03-product-intro">
          <div className="container">
            <h2 className="s03-pi-headline">
              Infused Seltzers.<br />
              Made with <span className="accent">real fruit.</span>
            </h2>
            <p className="s03-pi-subhead">
              Clean, carbonated, and crafted to showcase real fruit character.
              Federally-legal Delta-9 THC, emulsified for precise dosing — so every
              can delivers exactly the experience you chose.
            </p>
            <div className="s03-pi-fruits" aria-hidden="true">
              {/* Placeholder fruit chips — swap .s03-pi-fruit inner content */}
              {/*  with <img src="..." /> once real illustrations are available. */}
              <div className="s03-pi-fruit fruit-strawberry">
                <div className="s03-pi-fruit-placeholder" />
                <div className="s03-pi-fruit-label">Strawberry</div>
              </div>
              <div className="s03-pi-fruit fruit-watermelon">
                <div className="s03-pi-fruit-placeholder" />
                <div className="s03-pi-fruit-label">Watermelon</div>
              </div>
              <div className="s03-pi-fruit fruit-lemon">
                <div className="s03-pi-fruit-placeholder" />
                <div className="s03-pi-fruit-label">Lemon</div>
              </div>
              <div className="s03-pi-fruit fruit-blueberry">
                <div className="s03-pi-fruit-placeholder" />
                <div className="s03-pi-fruit-label">Blueberry</div>
              </div>
              <div className="s03-pi-fruit fruit-bloodorange">
                <div className="s03-pi-fruit-placeholder" />
                <div className="s03-pi-fruit-label">Blood Orange</div>
              </div>
              <div className="s03-pi-fruit fruit-blackberry">
                <div className="s03-pi-fruit-placeholder" />
                <div className="s03-pi-fruit-label">Blackberry</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · FOUR TIERS ───────────────────────────────────────────── */}
        <section className="s06-tiers">
          <div className="container">
            <h2 className="s06-headline">
              Four options.<br />
              Find your <span className="accent">perfect dose.</span>
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
            <h2 className="s04-headline">What's Inside?</h2>
            <div className="s04-trifecta">
              <div className="s04-col s04-col-left">
                <div className="s04-ing">
                  <div className="s04-ing-name">Purified Water</div>
                  <div className="s04-ing-desc">
                    Reverse-osmosis filtered water carefully chosen for exceptional
                    hydration &amp; uncompromising flavor.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Pure Cane Sugar</div>
                  <div className="s04-ing-desc">
                    A touch of real sugar for smooth, naturally derived sweetness.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Natural Flavoring</div>
                  <div className="s04-ing-desc">
                    Sourced from real fruits and botanicals, our flavors deliver
                    bright, authentic notes true to their names.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Fresh Lemon Juice</div>
                  <div className="s04-ing-desc">
                    Used exclusively in our Lemonade flavors, this ingredient brings
                    a hint of crisp acidity with a natural citrus lift.
                  </div>
                </div>
              </div>
              <div className="s04-center">
                {/* Placeholder center can — swap background for real image */}
                <div className="s04-can-placeholder" aria-hidden="true" />
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
                  A family business.<br />A new kind of drink.
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
                Find SUNRISE<br />near you.
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
          <h2 className="s09-heading">What people say.</h2>
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
                The questions we hear <span className="accent">most.</span>
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

        {/* ── 10 · LIFESTYLE REEL ───────────────────────────────────────── */}
        {/* Silent visual closer before footer — no header, no borders,    */}
        {/* edge-to-edge filmstrip. Track renders IMAGES twice back-to-back */}
        {/* and animates translateX(0) → translateX(-50%) for a seamless    */}
        {/* loop. Hover pauses. prefers-reduced-motion disables animation.  */}
        <section className="s11-reel" aria-label="Lifestyle imagery">
          <div className="s11-reel-track">
            {[...IMAGES, ...IMAGES].map((img, idx) => (
              <div
                key={idx}
                className="s11-reel-tile"
                aria-hidden={idx >= IMAGES.length ? "true" : undefined}
              >
                <img src={img.src} alt={img.alt} loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
