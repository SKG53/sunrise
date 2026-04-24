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

        {/* ── 02 + 03 · INTRO (centered) ────────────────────────────────── */}
        {/* Old S02 heading + 3 paragraphs from old S03. Image removed.    */}
        {/* Occupies S02 and S03 slots in new numbering.                   */}
        <section className="a-intro">
          <div className="container">
            <div className="a-intro-inner">
              <h2 className="a-intro-headline">
                Born in the<br />
                <span className="accent">heart</span> of America
              </h2>
              <div className="a-intro-body">
                <p>
                  <span className="a-intro-emphasizer">A family company. A new kind of drink.</span>
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
                <p>
                  <span className="a-intro-emphasizer">Every can, every batch.</span>
                  {" "}Made in-house. Made in Oklahoma. Made to be what the
                  category has been missing — real ingredients, real effects,
                  real people behind the work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · CANS ROW ─────────────────────────────────────────────── */}
        {/* Three cans in lifestyle trio format. No copy, no labels.       */}
        <section className="a-cans">
          <div className="container">
            <div className="a-cans-row">
              <img
                className="a-cans-can"
                src="/images/cans/60mg-blueberry-lemonade.webp"
                alt="SUNRISE 60mg THC Blueberry Lemonade"
                loading="lazy"
              />
              <img
                className="a-cans-can"
                src="/images/cans/10mg-lemonade.webp"
                alt="SUNRISE 10mg THC Lemonade"
                loading="lazy"
              />
              <img
                className="a-cans-can"
                src="/images/cans/60mg-blood-orange-cbg.webp"
                alt="SUNRISE 60mg THC + 30mg CBG Blood Orange"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ── 05 · ICONS ────────────────────────────────────────────────── */}
        {/* Three icons with titles and body copy. Stacked vertically.     */}
        <section className="a-icons">
          <div className="container">
            <div className="a-icons-list">
              <div className="a-icons-item">
                <img
                  className="a-icons-icon"
                  src="/icons/real-fruit.svg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="a-icons-content">
                  <div className="a-icons-title">Real Fruit, Real Flavor</div>
                  <p className="a-icons-body">
                    Real fruit flavors and natural ingredients ensure a delicious
                    experience without any weedy aftertastes.
                  </p>
                </div>
              </div>
              <div className="a-icons-item">
                <img
                  className="a-icons-icon"
                  src="/icons/consistent-formulation.svg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="a-icons-content">
                  <div className="a-icons-title">Consistent &amp; Reliable Formulation</div>
                  <p className="a-icons-body">
                    Carefully blended in small batches, our proprietary
                    nano-emulsification means you'll enjoy reliable experiences
                    with each and every can.
                  </p>
                </div>
              </div>
              <div className="a-icons-item">
                <img
                  className="a-icons-icon"
                  src="/icons/elevated-experience.svg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="a-icons-content">
                  <div className="a-icons-title">Elevated Experience</div>
                  <p className="a-icons-body">
                    From first sip to full effect, our carefully chosen flavors
                    offer a balanced, enjoyable experience that feels as good as
                    it tastes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · BUILD (old Heartland + How We Build merged) ──────────── */}
        {/* Route 66 heartland intro + three in-house pillars. On cream —  */}
        {/* no green flood.                                                */}
        <section className="a-build">
          <div className="container">
            <div className="a-build-head">
              <h2 className="a-build-headline">
                Route 66<br />
                Tulsa, <span className="accent">Oklahoma</span>
              </h2>
              <p className="a-build-lead">
                Not a coastal beverage brand. Built in the American heartland,
                where the supply chain is short, the roots run deep, and the
                work still happens where it's named. Three principles shape
                every can. None of them are shortcuts.
              </p>
            </div>
            <div className="a-build-pillars">
              <div className="a-build-pillar">
                <div className="a-build-pillar-title">In-House Formulation</div>
                <p className="a-build-pillar-body">
                  Every product is built from scratch by our own team — no contract outsourcing,
                  no white-label shortcuts. Formulation is a craft we own end-to-end.
                </p>
              </div>
              <div className="a-build-pillar">
                <div className="a-build-pillar-title">Small-Batch Craft</div>
                <p className="a-build-pillar-body">
                  Deliberate batch sizes. Quality over scale. Every run gets the attention
                  that makes the difference you taste from the first sip to the last.
                </p>
              </div>
              <div className="a-build-pillar">
                <div className="a-build-pillar-title">Full-Panel Testing</div>
                <p className="a-build-pillar-body">
                  Every batch is third-party tested for cannabinoid content and contaminants.
                  Every COA is published. Nothing to hide, and nothing ever does.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 07 · PATH TO PURCHASE (tier-10 flood) ─────────────────────── */}
        <section className="a-ptp">
          <div className="container">
            <div className="a-ptp-inner">
              <div className="a-ptp-copy">
                <h2 className="a-ptp-headline">Now that you know us</h2>
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
