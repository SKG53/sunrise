import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./social.css";

export const Route = createFileRoute("/social")({
  component: SocialPage,
  head: () => ({
    meta: [
      { title: "Social · SUNRISE" },
      {
        name: "description",
        content:
          "SUNRISE Beverage. Hemp-infused seltzer.",
      },
      // Hidden from search engines — discoverable only via the footer easter egg.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// Hidden /social route. Discoverable via a tiny "Social" link in the
// SiteFooter Follow column. Structure:
//   01 · Page hero band — wordmark deep-purple flood (#4F308D), large
//        cream uppercase "SOCIAL" with the staggered character fade-in
//        animation borrowed from the policy-page hero (pp-pagehero) pattern.
//   02 · Ingredients section — clones the home /index "What's Inside Each
//        Can?" S04 layout exactly (4-ingredient left column, central can,
//        4-ingredient right column, headline above) but swaps the static
//        .s04-can <img> for a 360° rotating-can stacked-frame animation
//        sourced from /images/cans/lemonade-360-{1..10}.webp.
//
// Class set is scoped under .social-* for the page-specific elements
// (.social-pagehero*, .social-rotator*) and reuses the .s04-* class set
// directly for the ingredients section so the layout stays bit-for-bit
// identical to home and any future home-side change auto-propagates.
// The .s04-* CSS lives in home.css; we re-import only the rules we need
// at the top of social.css.
function SocialPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="social-pagehero">
          <h1 className="social-pagehero-title" aria-label="Social">
            {"Social".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · WHAT'S INSIDE — ROTATING CAN ─────────────────────────── */}
        {/* Cloned 1:1 from the home /index s04-whats-inside section. The   */}
        {/* only divergence: .s04-center holds the .social-rotator sprite-  */}
        {/* sheet element instead of the static <img className="s04-can" /> */}
        {/* (the rotator is sized to match .s04-can max-width exactly).     */}
        <section className="s04-whats-inside">
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
                {/* Stacked-frame rotation: 10 individual <img> elements,    */}
                {/* one per 36° step of vertical rotation. Each image is     */}
                {/* 960×1920 (matches home /index static-can resolution      */}
                {/* exactly). Animation: 10s cycle, each frame staggered by  */}
                {/* 1.0s. Keyframe is a cross-fade (3% fade-in, 7% full      */}
                {/* hold, 3% fade-out) so adjacent frames overlap for ~0.3s, */}
                {/* simulating motion blur through each 36° arc. No sprite — */}
                {/* every frame is a discrete asset under Lovable's image-  */}
                {/* optimization width cap so source resolution survives     */}
                {/* deploy intact.                                            */}
                <div
                  className="social-rotator"
                  role="img"
                  aria-label="SUNRISE 10mg THC Lemonade hemp-infused seltzer can rotating"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <img
                      key={n}
                      className="social-rotator-frame"
                      src={`/images/cans/lemonade-360-${n}.webp`}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ animationDelay: `${(n - 1) * 1.0}s` }}
                    />
                  ))}
                </div>
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
      </main>

      <SiteFooter />
    </>
  );
}