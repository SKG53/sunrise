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
      { rel: "canonical", href: "https://www.savorsunrise.com/about" },
    ],
  }),
});

// ── 15 active-SKU cans, ordered by potency then flavor, for the horizontal
// scroll strip. Base filenames map to /images/cans/<file>.webp. ──
const ABOUT_CANS = [
  { file: "10mg-lemonade", name: "Lemonade 10mg" },
  { file: "10mg-strawberry", name: "Strawberry 10mg" },
  { file: "10mg-watermelon", name: "Watermelon 10mg" },
  { file: "30mg-cherry-limeade", name: "Cherry Limeade 30mg" },
  { file: "30mg-orange-lemonade", name: "Orange Lemonade 30mg" },
  { file: "30mg-peach-mango", name: "Peach Mango 30mg" },
  { file: "30mg-kiwi-watermelon-cbg", name: "Kiwi Watermelon 30mg + CBG" },
  { file: "30mg-blueberry-pomegranate-cbn", name: "Blueberry Pomegranate 30mg + CBN" },
  { file: "30mg-strawberry-watermelon-thcv", name: "Strawberry Watermelon 30mg + THCV" },
  { file: "60mg-blueberry-lemonade", name: "Blueberry Lemonade 60mg" },
  { file: "60mg-passionfruit-mango", name: "Passionfruit Mango 60mg" },
  { file: "60mg-wild-cherry-peach", name: "Wild Cherry Peach 60mg" },
  { file: "60mg-blood-orange-cbg", name: "Blood Orange 60mg + CBG" },
  { file: "60mg-blackberry-cbn", name: "Blackberry 60mg + CBN" },
  { file: "60mg-strawberry-kiwi-thcv", name: "Strawberry Kiwi 60mg + THCV" },
];

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

        {/* ── 02 · INTRO ─────────────────────────────────────────────────── */}
        {/* Old S02 heading + 3 paragraphs from old S03. Image removed.    */}
        {/* Occupies S02 and S03 slots in new numbering.                   */}
        <section className="a-intro">
          <div className="container">
            <div className="a-intro-inner">
              <h2 className="a-intro-headline">
                Simple beginnings<br />
                for a <span className="accent">new kind of drink</span>
              </h2>
              <div className="a-intro-body">
                <p>
                  SUNRISE started the way the best beverages always have — with a
                  family, a workshop, and a conviction that what's on the shelf
                  could be better. Founded along America's historic Route 66, we
                  build every can the way we always have: in small batches, by
                  people who've been making emulsified beverages since regulated
                  markets around the country have opened up.
                </p>
                <p>
                  Our team brings years of beverage manufacturing to the table —
                  formulation, production, and testing. What's new is the category.
                  What's not new is how we approach it. Every SUNRISE can is made
                  from simple ingredients and pure cane sugar, emulsified with hemp
                  extract in our own facility. We make sure every batch is
                  comprehensively tested by a third-party ISO-certified lab before
                  products are shipped anywhere.
                </p>
                <p>
                  <span className="a-intro-emphasizer">Every can, every batch.</span>
                  {" "}Made in-house. Made to be what the category has been missing
                  — simple ingredients, delicious flavors, and real effects that
                  deliver consistency with every sip.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · CANS + BULLETS ───────────────────────────────────────── */}
        {/* Two horizontal rows stacked vertically: 3 cans side-by-side on   */}
        {/* top (all same size), 3 icon-bullet items side-by-side beneath.   */}
        {/* Old standalone .a-icons section was removed in the prior turn    */}
        {/* and its content folded in here. Existing .a-icons-* classes      */}
        {/* preserved so the icon item shape stays consistent — only the    */}
        {/* wrapping layout context changed.                                  */}
        <section className="a-cans">
          <div className="container">
            <div className="a-cans-scroll">
              {ABOUT_CANS.map((c) => (
                <img
                  key={c.file}
                  className="a-cans-scroll-can"
                  src={`/images/cans/${c.file}.webp`}
                  alt={`SUNRISE ${c.name} hemp-infused THC seltzer can`}
                  width="960"
                  height="1920"
                  loading="lazy"
                />
              ))}
            </div>
            <div className="a-build-pillars">
              <div className="a-build-pillar">
                <div className="a-build-pillar-title">Simple Ingredients, Real Flavor</div>
                <p className="a-build-pillar-body">
                  Simple ingredients flavors and natural ingredients ensure a delicious
                  experience without any weedy aftertastes.
                </p>
              </div>
              <div className="a-build-pillar">
                <div className="a-build-pillar-title">Small-Batch Craft</div>
                <p className="a-build-pillar-body">
                  Carefully blended in small batches, our proprietary nano-emulsification
                  means you'll enjoy reliable experiences with each and every can.
                </p>
              </div>
              <div className="a-build-pillar">
                <div className="a-build-pillar-title">Full-Panel Testing</div>
                <p className="a-build-pillar-body">
                  Every batch is third-party tested for cannabinoid content and contaminants.
                  Every COA is published and easy to access from our website.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · PATH TO PURCHASE ─────────────────────────────────────── */}
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
                <a href="/products" className="btn btn-on-color">Shop the Lineup</a>
                <a href="/find" className="btn btn-on-color-ghost">
                  Find Near You
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
