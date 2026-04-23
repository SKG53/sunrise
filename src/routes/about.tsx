// =============================================================================
// SUNRISE — about.tsx
// Path: src/routes/about.tsx
// Session: SBev.BC.WebsiteDesign.About.1 · About route — full build
//
// OVERWRITES the scaffolded placeholder.
// Brand voice per Voice Guide v5. Section order: Hero, Origin (with
// emphasizers + interruptors), American Heartland (green flood), How We
// Build, Path to Purchase (red flood).
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
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
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/about" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
function AboutPage() {
  return (
    <>
      <SiteHeader activeNav="about" />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        {/* Giant color-flood page title. Tier-10 red reinforces brand     */}
        {/* heritage color also used in ptp section below and on home S06. */}
        <section className="a-pagehero">
          <h1 className="a-pagehero-title">About Us</h1>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
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

        {/* ── 03 · ORIGIN ───────────────────────────────────────────────── */}
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
                    <span className="a-origin-emphasizer">A family company. A new kind of drink.</span>
                    {" "}SUNRISE started the way the best beverages always have —
                    with a family, a workshop, and a conviction that what's on
                    the shelf could be better. Founded along America's historic
                    Route 66, we build every can the way we always have: in small
                    batches, by people who've been in beverage longer than most
                    brands have existed.
                  </p>
                  <p>
                    Our team brings decades of beverage manufacturing to the
                    work — formulation, production, blending, testing. What's
                    new is the category. What's not new is how we approach it.
                    Every SUNRISE is made from real fruit and pure cane sugar,
                    emulsified with hemp extract in our own facility, tested
                    batch by batch before it ever reaches a can.
                  </p>
                  <div className="a-origin-interruptor">
                    <em>An old craft. A new category.</em>
                  </div>
                  <p>
                    We built SUNRISE for a specific moment — the quiet one, the
                    in-between one, the one where people used to reach for
                    something stronger and are now looking for something
                    smarter. A drink for the small gatherings. The mid-week
                    reset. The dinner that used to need wine and doesn't
                    anymore. Something you can actually share, remember, and
                    reach for again.
                  </p>
                  <div className="a-origin-interruptor">
                    <em>Sipped, savored, and shared.</em>
                  </div>
                  <p>
                    <span className="a-origin-emphasizer">Every can, every batch.</span>
                    {" "}Made in-house. Made in Oklahoma. Made to be what the
                    category has been missing — real ingredients, real effects,
                    real people behind the work.
                  </p>
                </div>
              </div>
              <div className="a-origin-image-wrap">
                <div className="a-origin-image" aria-hidden="true" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · AMERICAN HEARTLAND (tier-30 flood) ─────────────────────── */}
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

        {/* ── 05 · HOW WE BUILD ─────────────────────────────────────────── */}
        <section className="a-approach">
          <div className="container">
            <div className="a-approach-head">
              <h2 className="a-approach-headline">
                Built in-house.<br />
                Tested <span className="accent">every batch.</span>
              </h2>
              <p className="a-approach-lead">
                Three principles shape every can. None of them are shortcuts.
              </p>
            </div>
            <div className="a-approach-pillars">
              <div className="a-approach-pillar">
                <div className="a-approach-pillar-title">In-House Formulation</div>
                <p className="a-approach-pillar-body">
                  Every product is built from scratch by our own team — no contract outsourcing,
                  no white-label shortcuts. Formulation is a craft we own end-to-end.
                </p>
              </div>
              <div className="a-approach-pillar">
                <div className="a-approach-pillar-title">Small-Batch Craft</div>
                <p className="a-approach-pillar-body">
                  Deliberate batch sizes. Quality over scale. Every run gets the attention
                  that makes the difference you taste from the first sip to the last.
                </p>
              </div>
              <div className="a-approach-pillar">
                <div className="a-approach-pillar-title">Full-Panel Testing</div>
                <p className="a-approach-pillar-body">
                  Every batch is third-party tested for cannabinoid content and contaminants.
                  Every COA is published. Nothing to hide, and nothing ever does.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · PATH TO PURCHASE (tier-10 flood) ─────────────────────── */}
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
