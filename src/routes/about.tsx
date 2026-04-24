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
          <h1 className="a-pagehero-title" aria-label="About Us">
            {"About Us".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
        {/* ── 02 · STORY ────────────────────────────────────────────────── */}
        {/* Combined from original S02 Hero + S03 Origin. Single-column     */}
        {/* centered typographic block on cream. No 2-column split, no     */}
        {/* image. Headline sets place, body explains product.              */}
        <section className="a-story">
          <div className="container">
            <div className="a-story-inner">
              <h2 className="a-story-headline">
                Born in the<br />
                <span className="accent">heart</span> of America.
              </h2>
              <div className="a-story-body">
                <p>
                  SUNRISE is a hemp-infused seltzer company — federally-legal
                  Delta-9 THC, emulsified and produced by a family-owned team
                  along Route 66 in Tulsa, Oklahoma.
                </p>
                <p>
                  Four potency tiers, six flavors per tier, twenty-four products
                  total. Every can is built to three rules: taste like the
                  beverage it is, dose like a finished product, hold its own in
                  any cooler. Real fruit. Cane sugar. Water. Proprietary emulsion
                  made in-house. Every batch tested, every SKU verified, every
                  dose precise.
                </p>
                <p>
                  One facility. One team. One batch at a time — an old-fashioned
                  way of building a new kind of drink.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · METHOD ───────────────────────────────────────────────── */}
        {/* Combined from original S04 Heartland + S05 Approach. On cream  */}
        {/* (no tier-30 flood). Heartland framing lives at the top of the   */}
        {/* section rather than as a visual color flood. Three pillars      */}
        {/* detail the how.                                                 */}
        <section className="a-method">
          <div className="container">
            <div className="a-method-head">
              <h2 className="a-method-headline">
                Route 66.<br />
                Tulsa, <span className="accent">Oklahoma.</span>
              </h2>
              <p className="a-method-lead">
                Every can is formulated, emulsified, and filled where the name
                suggests — in a single Tulsa facility on historic Route 66.
                Short supply chain. Deep roots. Work done where it's named.
              </p>
            </div>
            <div className="a-method-pillars">
              <div className="a-method-pillar">
                <div className="a-method-pillar-title">Made under one roof.</div>
                <p className="a-method-pillar-body">
                  Formulation, emulsion, filling, and labeling all happen in the
                  same facility. No contract manufacturers, no white-label runs,
                  no outsourced QC. Every can passes through our team from raw
                  ingredient to finished pack.
                </p>
              </div>
              <div className="a-method-pillar">
                <div className="a-method-pillar-title">Deliberate by design.</div>
                <p className="a-method-pillar-body">
                  We sized the operation around quality, not scale. Every run is
                  small enough to check, blend, and adjust by hand — and big
                  enough to hold a consistent profile across the twenty-four
                  SKUs in the lineup.
                </p>
              </div>
              <div className="a-method-pillar">
                <div className="a-method-pillar-title">Every batch, every SKU.</div>
                <p className="a-method-pillar-body">
                  Every batch is tested by an independent third-party lab for
                  cannabinoid accuracy and contaminants before release.
                  Twenty-four SKUs, every run — not sampled, not skipped, not
                  averaged.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · PATH TO PURCHASE (tier-10 flood) ─────────────────────── */}
        <section className="a-ptp">
          <div className="container">
            <div className="a-ptp-inner">
              <div className="a-ptp-copy">
                <h2 className="a-ptp-headline">That's SUNRISE.</h2>
                <p className="a-ptp-body">
                  Find it direct, or in a cooler near you.
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
