// =============================================================================
// SUNRISE — about.tsx
// Path: src/routes/about.tsx
// Session: SBev.BC.WebsiteDesign.About.1 · About route — full build
//
// OVERWRITES the scaffolded placeholder.
// Brand voice per Voice Guide v5. Section order: Hero, Origin, How We Build,
// American Heartland (green flood), What's Inside, Path to Purchase.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { render12ozStatBlock, getBasePx } from "../lib/sunrise-components";
import "./about.css";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About · SUNRISE" },
      {
        name: "description",
        content:
          "A family-owned beverage company built along Route 66 in Tulsa, Oklahoma. Hemp-derived Delta-9 THC seltzers made in-house, full-panel tested, and crafted in the American heartland.",
      },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
function AboutPage() {
  const stat12Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paint = () => {
      if (!stat12Ref.current) return;
      const base = getBasePx();
      stat12Ref.current.innerHTML = render12ozStatBlock(base * 0.95);
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  return (
    <>
      <SiteHeader activeNav="about" />

      <main>
        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="a-hero">
          <div className="container">
            <div className="a-hero-inner">
              <h1 className="a-hero-headline">
                A better way to drink.<br />
                Made in the <span className="accent">heartland.</span>
              </h1>
              <p className="a-hero-body">
                Hemp-derived Delta-9 THC seltzers, made in Oklahoma,
                built by a family that has spent decades in beverage.
              </p>
            </div>
          </div>
        </section>

        {/* ── 02 · ORIGIN ───────────────────────────────────────────────── */}
        <section className="a-origin">
          <div className="container">
            <div className="a-origin-inner">
              <div className="a-origin-copy">
                <h2 className="a-origin-headline">
                  Generations in beverage.<br />
                  A new kind of <span className="accent">drink.</span>
                </h2>
                <div className="a-origin-body">
                  <p>
                    Founded along America's historic Route 66 and proudly family-owned,
                    SUNRISE is a beverage company reimagining drinks for today's consumers.
                  </p>
                  <p>
                    With deep roots in multi-state beverage formulation and manufacturing,
                    our team is uniquely positioned to lead the non-alcoholic beverage boom.
                    Every product is created in-house and proudly made in the USA.
                  </p>
                  <p>
                    Paired with an uncompromising focus on quality and simple ingredients,
                    SUNRISE offers an experience like no other.
                  </p>
                </div>
              </div>
              <div className="a-origin-image-wrap">
                <div className="a-origin-image" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · HOW WE BUILD ─────────────────────────────────────────── */}
        <section className="a-approach">
          <div className="container">
            <div className="a-approach-head">
              <h2 className="a-approach-headline">
                Built in-house.<br />
                Tested <span className="accent">every batch.</span>
              </h2>
              <p className="a-approach-sub">
                The four operating principles that shape every can of SUNRISE.
              </p>
            </div>
            <div className="a-approach-grid">
              <div className="a-approach-card">
                <div className="a-approach-card-num">01</div>
                <div className="a-approach-card-title">In-House Formulation</div>
                <p className="a-approach-card-body">
                  Every product is built from scratch by our own team — no contract outsourcing,
                  no white-label shortcuts. Formulation is a craft we own end-to-end.
                </p>
              </div>
              <div className="a-approach-card">
                <div className="a-approach-card-num">02</div>
                <div className="a-approach-card-title">Small-Batch Craft</div>
                <p className="a-approach-card-body">
                  Deliberate batch sizes. Quality over scale. Every run gets the attention
                  that makes the difference you taste from the first sip to the last.
                </p>
              </div>
              <div className="a-approach-card">
                <div className="a-approach-card-num">03</div>
                <div className="a-approach-card-title">Full-Panel Testing</div>
                <p className="a-approach-card-body">
                  Every batch is third-party tested for cannabinoid content and contaminants.
                  Every COA is published. Nothing to hide, and nothing ever does.
                </p>
              </div>
              <div className="a-approach-card">
                <div className="a-approach-card-num">04</div>
                <div className="a-approach-card-title">American Made</div>
                <p className="a-approach-card-body">
                  Ingredients sourced and product produced in the USA.
                  Hemp grown under federal law. Made proudly in Tulsa, Oklahoma.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · AMERICAN HEARTLAND (tier-30 flood, can imagery to come) ─ */}
        <section className="a-heartland">
          <div className="container">
            <div className="a-heartland-inner">
              <h2 className="a-heartland-headline">
                Route 66.<br />
                Tulsa, <span className="accent">Oklahoma.</span>
              </h2>
              <p className="a-heartland-body">
                Not a coastal beverage brand. Built in the American heartland,
                where the supply chain is short, the roots run deep,
                and the work still happens where it's named.
              </p>
            </div>
          </div>
        </section>

        {/* ── 05 · WHAT'S INSIDE ────────────────────────────────────────── */}
        <section className="a-inside">
          <div className="container">
            <div className="a-inside-head">
              <h2 className="a-inside-headline">
                Real ingredients.<br />
                Real <span className="accent">effects.</span>
              </h2>
              <p className="a-inside-lead">
                Every SUNRISE seltzer starts with real fruit, pure cane sugar, and hemp extract
                emulsified in small batches — nothing artificial, nothing you can't pronounce.
              </p>
            </div>

            <div className="a-inside-pillars">
              <div className="a-inside-pillar">
                <div className="a-inside-pillar-title">Flavor</div>
                <p className="a-inside-pillar-body">
                  Real, natural fruit and pure cane sugar. A crisp, mid-calorie profile
                  that tastes as good as it looks — no artificial sweeteners, no shortcuts.
                </p>
              </div>
              <div className="a-inside-pillar">
                <div className="a-inside-pillar-title">Consistency</div>
                <p className="a-inside-pillar-body">
                  Expertly emulsified hemp extracts deliver a reliable experience every
                  single time. Can to can, batch to batch, sip to sip.
                </p>
              </div>
              <div className="a-inside-pillar">
                <div className="a-inside-pillar-title">Transparency</div>
                <p className="a-inside-pillar-body">
                  Certified production facilities and third-party full-panel testing
                  ensure every can is perfectly dosed and fully compliant.
                </p>
              </div>
            </div>

            <div className="a-inside-stats">
              <div className="a-inside-stats-stat" ref={stat12Ref} />
              <div className="a-inside-stats-badges">
                <div className="a-inside-badge">Natural Vegan</div>
                <div className="a-inside-badge">Gluten Free</div>
                <div className="a-inside-badge">Zero Alcohol</div>
                <div className="a-inside-badge">Infused with B12</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · PATH TO PURCHASE ─────────────────────────────────────── */}
        <section className="a-ptp">
          <div className="container">
            <div className="a-ptp-inner">
              <div className="a-ptp-copy">
                <h2 className="a-ptp-headline">Now that you know us.</h2>
                <p className="a-ptp-body">
                  Find SUNRISE direct, or in stores near you.
                </p>
              </div>
              <div className="a-ptp-ctas">
                <a href="/products" className="btn btn-on-color">Shop Now →</a>
                <a href="/find" className="btn btn-on-color-ghost">
                  Find Near You →
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
