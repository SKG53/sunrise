import { createFileRoute, Link } from "@tanstack/react-router";
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

// ── S03 TIER CARDS ───────────────────────────────────────────────────────
// Four PD-style cards, one per potency tier. Each represents a flagship
// base flavor whose color drives the can-frame flood — chosen for spread
// (orange / red / peach / navy) that mirrors the SUNRISE wordmark gradient
// feel. All four are base flavors, no cannabinoid variants, so the visual
// message stays clean around the "natural ingredients" headline. Each card
// links to its PD page; the potency lockup is painted in cream over the
// flavor flood as a top-left badge so tier identity reads at a glance.
const S03_TIER_CARDS = [
  {
    slug: "5mg-blood-orange",
    flavor: "Blood Orange",
    descriptor: "Tart + Punchy",
    color: "#DC7F27",
    tier: 5 as const,
  },
  {
    slug: "10mg-strawberry",
    flavor: "Strawberry",
    descriptor: "Fresh + Fruity",
    color: "#CC1F39",
    tier: 10 as const,
  },
  {
    slug: "30mg-peach-mango",
    flavor: "Peach Mango",
    descriptor: "Lush + Tropical",
    color: "#E89B5B",
    tier: 30 as const,
  },
  {
    slug: "60mg-blueberry-lemonade",
    flavor: "Blueberry Lemonade",
    descriptor: "Rich + Tangy",
    color: "#21285A",
    tier: 60 as const,
  },
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
  const lockup5CardRef = useRef<HTMLSpanElement>(null);
  const lockup10CardRef = useRef<HTMLSpanElement>(null);
  const lockup30CardRef = useRef<HTMLSpanElement>(null);
  const lockup60CardRef = useRef<HTMLSpanElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const [manifestoInView, setManifestoInView] = useState(false);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const lockupBase = window.innerWidth <= 520 ? 48 : 80;
      const cardLockupBase = window.innerWidth <= 520 ? 28 : 44;
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, "cream");
      if (lockup5Ref.current)  lockup5Ref.current.innerHTML  = render5mgLockup(lockupBase,  "#FEFBE0");
      if (lockup10Ref.current) lockup10Ref.current.innerHTML = render10mgLockup(lockupBase, "#FEFBE0");
      if (lockup30Ref.current) lockup30Ref.current.innerHTML = render30mgLockup(lockupBase, "#FEFBE0");
      if (lockup60Ref.current) lockup60Ref.current.innerHTML = render60mgLockup(lockupBase, "#FEFBE0");
      if (lockup5CardRef.current)  lockup5CardRef.current.innerHTML  = render5mgLockup(cardLockupBase,  "#FEFBE0");
      if (lockup10CardRef.current) lockup10CardRef.current.innerHTML = render10mgLockup(cardLockupBase, "#FEFBE0");
      if (lockup30CardRef.current) lockup30CardRef.current.innerHTML = render30mgLockup(cardLockupBase, "#FEFBE0");
      if (lockup60CardRef.current) lockup60CardRef.current.innerHTML = render60mgLockup(cardLockupBase, "#FEFBE0");
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
        {/* Centered copy inside the container, followed by a 4-up grid of   */}
        {/* PD-style tier cards. One card per potency tier (5/10/30/60), each */}
        {/* card a flagship base flavor whose color floods the can frame.     */}
        {/* Card pattern mirrors PD page related-flavor cards: flooded can    */}
        {/* frame on top, name + descriptor below. A potency lockup painted   */}
        {/* in cream sits in the can frame's top-left corner so tier identity */}
        {/* reads at a glance even before the eye reaches the meta block.     */}
        {/* Whole card is a Link to the SKU's PD page.                        */}
        <section className="s03-product-intro">
          <div className="container">
            <h2 className="s03-pi-headline">
              Infused Seltzers<br />
              Made with <span className="accent">natural ingredients.</span>
            </h2>
            <p className="s03-pi-subhead">
              Clean, lightly carbonated, and crafted to showcase natural
              ingredients, our drinks are ready to be your new favorite!
              Available in multiple flavors and doses, every can delivers
              exactly the experience you choose.
            </p>
            <div className="s03-card-grid">
              {S03_TIER_CARDS.map((card) => {
                const ref =
                  card.tier === 5  ? lockup5CardRef  :
                  card.tier === 10 ? lockup10CardRef :
                  card.tier === 30 ? lockup30CardRef :
                                     lockup60CardRef;
                return (
                  <Link
                    key={card.slug}
                    to="/products/$slug"
                    params={{ slug: card.slug }}
                    className="s03-card"
                  >
                    <div className="s03-card-can" style={{ background: card.color }}>
                      <img
                        src={`/images/cans/${card.slug}.webp`}
                        alt={`SUNRISE ${card.tier}mg THC ${card.flavor} hemp-infused seltzer can`}
                        loading="lazy"
                      />
                      <span
                        className="s03-card-tier"
                        ref={ref}
                        aria-label={`${card.tier} milligram THC`}
                      />
                    </div>
                    <div className="s03-card-meta">
                      <div className="s03-card-name">{card.flavor}</div>
                      <div className="s03-card-descriptor">{card.descriptor}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 04 · FOUR TIERS ───────────────────────────────────────────── */}
        <section className="s06-tiers">
          <div className="container">
            <h2 className="s06-headline">
              Find your<br />
              <span className="accent">perfect dose.</span>
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
                    Casual sips, afternoon resets, or fun social gatherings.
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
                  src="/images/cans/10mg-lemonade.webp"
                  alt="SUNRISE 10mg THC Lemonade hemp-infused seltzer can"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="s04-col s04-col-right">
                <div className="s04-ing">
                  <div className="s04-ing-name">Emulsified<br />Hemp Extract</div>
                  <div className="s04-ing-desc">
                    The good stuff — expertly blended cannabis extract for a clean
                    and consistent experience with every sip.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Naturally Sourced<br />Enhancers</div>
                  <div className="s04-ing-desc">
                    Functional ingredients like B12 that allow for a healthier,
                    more balanced experience without altering flavors.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Citric<br />Acid</div>
                  <div className="s04-ing-desc">
                    A naturally occurring acid found in citrus fruits, this is used
                    to balance flavors and keep things bubbly.
                  </div>
                </div>
                <div className="s04-ing">
                  <div className="s04-ing-name">Sodium<br />Benzoate</div>
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
              <div className="s07-cans" aria-hidden="true">
                <img
                  className="s07-can s07-can-lg"
                  src="/images/cans/10mg-blueberry-acai-thcv.webp"
                  alt=""
                />
                <img
                  className="s07-can s07-can-md"
                  src="/images/cans/30mg-cherry-limeade.webp"
                  alt=""
                />
                <img
                  className="s07-can s07-can-sm"
                  src="/images/cans/5mg-blood-orange.webp"
                  alt=""
                />
              </div>
              <div className="s07-copy">
                <h2 className="s07-headline">
                  Delicious drinks<br />Designed to deliver.
                </h2>
                <p className="s07-body">
                  SUNRISE was born with a simple conviction: it's about quality
                  and simple ingredients. Our team brings almost a decade of
                  beverage and branding experience to drinks for an experience
                  like no other.
                </p>
                <div className="s07-cta-row">
                  <a href="/about" className="btn btn-on-color-ghost">Read Our Story</a>
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
                <a href="/find" className="btn btn-primary">Find Near You</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 08 · FAQ ──────────────────────────────────────────────────── */}
        {/* Home-level FAQ. Broader than Product Detail — first-time-visitor */}
        {/* questions (brand, legality, effect, category, risk, purchase).  */}
        {/* SKU-specific questions (dose, onset, variants, COAs) stay on    */}
        {/* Product Detail. Visual pattern mirrors .pd-faq so the two feel  */}
        {/* like family.                                                     */}
        <section className="s10-faq">
          <div className="container">
            <div className="s10-faq-head">
              <h2 className="s10-faq-headline">
                What are people <span className="accent">asking?</span>
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
