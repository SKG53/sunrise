import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { S07Map } from "../components/S07Map";
import {
  renderWordmark,
  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — DO NOT DELETE
  // render5mgLockup,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
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

// ── ACTIVE POTENCY CLEANUP FLAG ───────────────────────────────────────
// 2026-05-08: When false, hides non-live SKUs (5mg tier, 30mg tier,
// 60mg Wild Cherry Peach, and 10mg cannabinoid variants) from the user-
// facing site for active potency cleanup. Reverse: change
// false → true and uncomment the related code blocks marked with the
// matching "HIDDEN FOR ACTIVE POTENCY CLEANUP" tag throughout this file.
// See docs/active-potency-cleanup-2026-05-08.md for full revival path.
const SHOW_NON_LIVE_PRODUCTS = false;

// ── FAQ DATA ─────────────────────────────────────────────────────────────
// Cold-traffic first-time-visitor questions. Curated subset of the canonical
// /faq master — five questions chosen to walk a cold visitor through the
// objections that block first purchase (legitimacy → legality → experience →
// dealbreaker → access). Copy locked to v6 of canonical FAQ. Footer link
// directs to /faq for the full set.
const FAQS = [
  {
    q: "What is hemp?",
    a: "Hemp is a variant of the cannabis plant with 0.3% Delta-9 THC or less by dry weight — federally legal under the 2018 Farm Bill. It still carries the same psychoactive properties at higher doses, so we encourage customers to choose their experience based on comfort and habit.",
  },
  {
    q: "Is SUNRISE legal?",
    a: "Yes — our beverages are 100% federally legal because every can uses hemp-derived Delta-9 THC at or below 0.3% by dry weight, which makes them legal under the 2018 Farm Bill. State laws vary, however. Please check your local rules for specific guidelines on hemp-infused beverage consumption.",
  },
  {
    q: "How will it feel?",
    a: "Depends on the potency and how your body responds. 5MG is light and social, 10MG more present, 30MG fuller and longer, 60MG a real evening. When in doubt, start lower within your comfort level, wait 40 minutes to an hour for the lift to settle, and consume more from there.",
  },
  {
    q: "Will it show up on a drug test?",
    a: "Possibly. Standard drug panels test for THC metabolites and don't distinguish hemp-derived THC from any other source. If your job or situation requires a clean test, we'd caution against our products.",
  },
  {
    q: "Where can I buy SUNRISE?",
    a: "Through retail partners in select states across the country, and direct from us at savorsunrise.com. We ship across the US in compliance with local state regulations for hemp beverages.",
  },
];

// ── S03 TIER CARDS ───────────────────────────────────────────────────────
// PD-style cards staggered 10mg / 60mg across the visible row. The 5mg and
// 30mg entries are preserved for fast revival when the active potency
// cleanup flag is reversed but are filtered out of the visible grid today
// (see SHOW_NON_LIVE_PRODUCTS gate downstream). Each card represents a
// flagship flavor whose color drives the can-frame flood; the potency
// lockup is painted in cream over the flavor flood as a top-left badge.
// Cannabinoid SKUs (e.g. 60mg Blood Orange +CBG) carry a second cream
// lockup as a vertical rotated strip on the can-frame's right edge — same
// pattern as the PD related-cards (.pd-related-corner), kept inside the
// can frame so the cream-on-color contrast holds.
type CardCannabinoid = "CBG" | "CBN" | "THCV";
type S03Card = {
  slug: string;
  flavor: string;
  descriptor: string;
  color: string;
  tier: 5 | 10 | 30 | 60;
  cannabinoid?: CardCannabinoid;
};
const S03_TIER_CARDS: S03Card[] = [
  // Hidden by SHOW_NON_LIVE_PRODUCTS gate today; live when flag is reversed.
  {
    slug: "5mg-blood-orange",
    flavor: "Blood Orange",
    descriptor: "Tart + Punchy",
    color: "#DC7F27",
    tier: 5,
  },
  {
    slug: "10mg-strawberry",
    flavor: "Strawberry",
    descriptor: "Fresh + Fruity",
    color: "#CC1F39",
    tier: 10,
  },
  {
    slug: "30mg-cherry-limeade",
    flavor: "Cherry Limeade",
    descriptor: "Tart + Refreshing",
    color: "#67092A",
    tier: 30,
  },
  {
    slug: "60mg-blueberry-lemonade",
    flavor: "Blueberry Lemonade",
    descriptor: "Rich + Tangy",
    color: "#21285A",
    tier: 60,
  },
  {
    slug: "30mg-strawberry-watermelon-thcv",
    flavor: "Strawberry Watermelon",
    descriptor: "Sweet + Fresh",
    color: "#0A6034",
    tier: 30,
    cannabinoid: "THCV",
  },
  {
    slug: "60mg-blood-orange-cbg",
    flavor: "Blood Orange",
    descriptor: "Tart + Punchy",
    color: "#DC7F27",
    tier: 60,
    cannabinoid: "CBG",
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
  // Array-indexed refs for the S03 tier-card lockups. Indexed by the card's
  // position in the FILTERED (visible) S03_TIER_CARDS array so each visible
  // card gets a dedicated ref. The single-ref-per-tier pattern broke once
  // the row gained two 10mg + two 60mg cards (two DOM nodes can't share one
  // ref). Cannabinoid refs follow the same array pattern and are only
  // populated for cards whose data carries a `cannabinoid` field.
  const cardLockupRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cardCannabinoidRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const [manifestoInView, setManifestoInView] = useState(false);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const lockupBase = window.innerWidth <= 520 ? 48 : 80;
      const cardLockupBase = window.innerWidth <= 520 ? 28 : 44;
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, "cream");
      // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — DO NOT DELETE
      // if (lockup5Ref.current)  lockup5Ref.current.innerHTML  = render5mgLockup(lockupBase,  "#FEFBE0");
      if (lockup10Ref.current) lockup10Ref.current.innerHTML = render10mgLockup(lockupBase, "#FEFBE0");
      if (lockup30Ref.current) lockup30Ref.current.innerHTML = render30mgLockup(lockupBase, "#FEFBE0");
      if (lockup60Ref.current) lockup60Ref.current.innerHTML = render60mgLockup(lockupBase, "#FEFBE0");
      // S03 card lockups — paint the tier badge + (when present) the
      // cannabinoid right-strip for every visible card. The order here must
      // match the JSX render order downstream so refs[i] aligns to card[i].
      const visibleCards = S03_TIER_CARDS.filter((card) =>
        SHOW_NON_LIVE_PRODUCTS || card.tier !== 5
      );
      visibleCards.forEach((card, i) => {
        const lockupEl = cardLockupRefs.current[i];
        if (lockupEl) {
          // 5mg and 30mg branches are intentionally inert in S03 with the
          // cleanup flag off; the filter above prevents those tiers from
          // reaching this loop. (30mg is revived elsewhere but the S03
          // layout is sized for 4 cards.)
          const html =
            card.tier === 10 ? render10mgLockup(cardLockupBase, "#FEFBE0") :
            card.tier === 30 ? render30mgLockup(cardLockupBase, "#FEFBE0") :
            card.tier === 60 ? render60mgLockup(cardLockupBase, "#FEFBE0") :
                               "";
          if (html) lockupEl.innerHTML = html;
        }
        const cbEl = cardCannabinoidRefs.current[i];
        if (cbEl && card.cannabinoid) {
          // Sized to mirror PD related-card cannabinoid lockups so the
          // visual language stays consistent between home and product
          // detail. Painted cream against the flavor-color flood inside
          // the can frame.
          const cbSize = base * 0.91;
          const html =
            card.cannabinoid === "CBG" ? renderCBGLockup(cbSize, "#FEFBE0") :
            card.cannabinoid === "CBN" ? renderCBNLockup(cbSize, "#FEFBE0") :
                                         renderTHCVLockup(cbSize, "#FEFBE0");
          cbEl.innerHTML = html;
        }
      });
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
              {S03_TIER_CARDS
                // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — filter hides 5mg cards when flag is false
                .filter((card) => SHOW_NON_LIVE_PRODUCTS || card.tier !== 5)
                .map((card, i) => {
                return (
                  <div
                    key={card.slug}
                    className="s03-card"
                    style={{ ["--card-flavor-color" as string]: card.color } as React.CSSProperties}
                  >
                    <Link
                      to="/products/$slug"
                      params={{ slug: card.slug }}
                      className="s03-card-link"
                    >
                      <div className="s03-card-can" style={{ background: card.color }}>
                        <img
                          src={`/images/cans/${card.slug}.webp`}
                          alt={`SUNRISE ${card.tier}mg THC ${card.flavor} hemp-infused seltzer can`}
                          loading="lazy"
                        />
                        <span
                          className="s03-card-tier"
                          ref={(el) => { cardLockupRefs.current[i] = el; }}
                          aria-label={`${card.tier} milligram THC`}
                        />
                        {card.cannabinoid && (
                          <span
                            className="s03-card-cannabinoid"
                            ref={(el) => { cardCannabinoidRefs.current[i] = el; }}
                            aria-label={`+${card.cannabinoid}`}
                          />
                        )}
                      </div>
                      <div className="s03-card-meta">
                        <div className="s03-card-name">{card.flavor}</div>
                        <div className="s03-card-descriptor">{card.descriptor}</div>
                      </div>
                    </Link>
                    <div className="s03-card-cta">
                      <Link
                        to="/products/$slug"
                        params={{ slug: card.slug }}
                        className="btn btn-flavor"
                        style={{ ["--flavor-color" as string]: card.color } as React.CSSProperties}
                      >
                        Buy Now
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section-closing bridge CTA — leads from the curated four-
                card sampling to the full /products grid. Uses the site-
                standard .btn .btn-secondary pattern (transparent fill,
                near-black 2px border, near-black text → wipes to near-
                black on hover with text flipping to cream). Mirrors the
                same treatment used as a section-closer on the PDP
                ("Find Near You"), the Contact page secondary action,
                and the Products page secondary CTAs — consistent
                section-closer vocabulary site-wide. Arrow glyph is
                appended automatically by the global .btn::after rule
                and inherits the btn-arrow-dance hover animation, so
                the hover behavior matches every other button on the
                site without per-element wiring.                          */}
            <div className="home-section-cta-row">
              <Link to="/products" className="btn btn-primary btn-xl">
                See the Full Lineup
              </Link>
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
              {/* HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — flag-gated */}
              {SHOW_NON_LIVE_PRODUCTS && (
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
              )}
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

            {/* Section-closing bridge CTA — same vocabulary as the S03      */}
            {/* close, repeated here so customers reaching the bottom of    */}
            {/* either the flavor-led S03 entry pathway or the experience-  */}
            {/* led S06 entry pathway encounter the same "see everything"  */}
            {/* invitation. The two pathways feed the same destination     */}
            {/* (/products), but offer different organizing axes — flavor   */}
            {/* (S03) or potency (S06).                                     */}
            <div className="home-section-cta-row">
              <Link to="/products" className="btn btn-primary btn-xl">
                See the Full Lineup
              </Link>
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
                  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — original src preserved for revival
                  // src="/images/cans/10mg-blueberry-acai-thcv.webp"
                  src="/images/cans/10mg-strawberry.webp"
                  alt=""
                />
                <img
                  className="s07-can s07-can-md"
                  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — original src preserved for revival
                  // src="/images/cans/30mg-cherry-limeade.webp"
                  src="/images/cans/60mg-blood-orange-cbg.webp"
                  alt=""
                />
                <img
                  className="s07-can s07-can-sm"
                  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — original src preserved for revival
                  // src="/images/cans/5mg-blood-orange.webp"
                  src="/images/cans/10mg-watermelon.webp"
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
            <div className="s10-faq-more">
              <a href="/faq" className="s10-faq-more-link">
                See the full FAQ <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </>
  );
}
