// =============================================================================
// SUNRISE — home.tsx (route: /)
// Session: SBev.BC.WebBuild.2 · Home route
//
// PATTERN NOTES:
//   • Imports the existing SiteHeader / SiteFooter from shell.
//   • Canonical render functions (renderWordmark, render[N]mgLockup) produce
//     pixel-accurate HTML strings. We mount them via ref.current.innerHTML
//     so the exact brand mark output is preserved byte-for-byte.
//   • All styling scoped via .s0X-* / .home-* / .hero-* classes in home.css.
//   • Placeholder image boxes are empty <div>s — intended as image-slot targets.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
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
  }),
});

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
        // measure natural width at a reference size, then scale so natural width === stack width
        line.style.fontSize = "100px";
        const natural = line.getBoundingClientRect().width;
        if (natural > 0) line.style.fontSize = (100 * target) / natural + "px";
      });
    };
    const paint = () => {
      const base = getBasePx();
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, "cream");
      if (lockup5Ref.current)  lockup5Ref.current.innerHTML  = render5mgLockup(80,  "#FEFBE0");
      if (lockup10Ref.current) lockup10Ref.current.innerHTML = render10mgLockup(80, "#FEFBE0");
      if (lockup30Ref.current) lockup30Ref.current.innerHTML = render30mgLockup(80, "#FEFBE0");
      if (lockup60Ref.current) lockup60Ref.current.innerHTML = render60mgLockup(80, "#FEFBE0");
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

        {/* ── 03 · ORIGIN ───────────────────────────────────────────────── */}
        <section className="s03-origin">
          <div className="container">
            <div className="s03-origin-inner">
              <div className="s03-copy">
                <div className="s03-eyebrow">Origin</div>
                <h2 className="s03-headline">
                  Born in the<br />Heart of America.
                </h2>
                <p className="s03-body">
                  Founded along America's historic Route 66 and proudly family-owned,
                  SUNRISE is a beverage company reimagining drinks for today's consumers.
                  With deep roots in multi-state beverage formulation, our team is built
                  to lead the non-alcoholic beverage boom. Every product is created in-house
                  and proudly made in the USA.
                </p>
              </div>
              <div className="s03-image-wrap">
                <div className="s03-image" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · WHAT'S INSIDE ────────────────────────────────────────── */}
        <section id="whats-inside" className="s04-whats-inside">
          <div className="container">
            <h2 className="s04-headline">
              Simple. Transparent. <span className="accent">Delicious.</span>
            </h2>
            <div className="s04-layout">
              <div className="s04-image-wrap">
                <div className="s04-image" />
              </div>
              <div className="s04-list">
                <div className="s04-row">
                  <div className="s04-ingredient-name">Purified Water</div>
                  <div className="s04-ingredient-desc">The base. Clean, crisp, carbonated.</div>
                </div>
                <div className="s04-row">
                  <div className="s04-ingredient-name">Pure Cane Sugar</div>
                  <div className="s04-ingredient-desc">
                    Real sweetness. No corn syrup, no artificial substitutes.
                  </div>
                </div>
                <div className="s04-row">
                  <div className="s04-ingredient-name">Natural Flavoring</div>
                  <div className="s04-ingredient-desc">
                    Real fruit character, sourced from real fruit.
                  </div>
                </div>
                <div className="s04-row">
                  <div className="s04-ingredient-name">Emulsified Hemp Extract</div>
                  <div className="s04-ingredient-desc">
                    Federally-legal Delta-9 THC, expertly emulsified for consistent
                    dosing in every can.
                  </div>
                </div>
                <div className="s04-row">
                  <div className="s04-ingredient-name">Natural Enhancers (B12)</div>
                  <div className="s04-ingredient-desc">
                    Added to support and elevate the experience.
                  </div>
                </div>
                <div className="s04-row">
                  <div className="s04-ingredient-name">Citric Acid · Sodium Benzoate</div>
                  <div className="s04-ingredient-desc">
                    For freshness and natural preservation.
                  </div>
                </div>
                <div className="s04-footnote">
                  Every batch full-panel tested.{" "}
                  <a href="#">View COAs for your flavor →</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · WHY SUNRISE ──────────────────────────────────────────── */}
        <section className="s05-why">
          <div className="container">
            <div className="s05-manifesto-line">Built with intention.</div>
            <div className="s05-manifesto-line">Dosed with precision.</div>
            <div className="s05-manifesto-line">Made to be enjoyed.</div>
          </div>
        </section>

        {/* ── 06 · FOUR TIERS ───────────────────────────────────────────── */}
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

        {/* ── 07 · STORY TEASER ─────────────────────────────────────────── */}
        <section className="s07-story">
          <div className="container">
            <div className="s07-layout">
              <div className="s07-portrait" />
              <div className="s07-copy">
                <div className="s07-eyebrow">Our Story</div>
                <h2 className="s07-headline">
                  A family business.<br />A new kind of drink.
                </h2>
                <p className="s07-body">
                  SUNRISE was born from a simple conviction: the world of non-alcoholic
                  drinks was due for a reinvention. Our team brings decades of beverage
                  manufacturing to the problem, and every can reflects that work.
                </p>
                <div className="s07-cta-row">
                  <a href="/about" className="btn btn-secondary">Read Our Story →</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 08 · NEAR YOU TEASER ──────────────────────────────────────── */}
        <section className="s08-near-you">
          <div className="s08-inner">
            <div className="s08-map-bg" />
            <div className="s08-card">
              <div className="s08-card-eyebrow">Near You</div>
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

        {/* ── 09 · REVIEWS ──────────────────────────────────────────────── */}
        <section className="s09-reviews">
          <div className="container">
            <div className="s09-inner">
              <div className="s09-quote-mark">"</div>
              <div className="s09-quote" />
              <div className="s09-attribution" />
              <div className="s09-progress">
                <div className="s09-progress-seg active" />
                <div className="s09-progress-seg" />
                <div className="s09-progress-seg" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
