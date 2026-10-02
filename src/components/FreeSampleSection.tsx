// FREE SAMPLES section ("Want a Taste?") — reusable across pages (home
// first). Promotes the WEBFREECAN offer (the web-only twin of the email
// FREECAN code, so web redemptions can be told apart): one free single can of
// any flavor/strength per order, the customer just covers shipping. Layout
// mirrors home S03 (Infused Seltzers / Simple Ingredients): 2-line headline
// with an accent second line, a short subhead + code box,
// then four PD-style product cards linking to their PD pages.
//
// The code box mirrors the Spin & Save reveal code graphic (.spin-code in
// SpinWheel.css): white field, 2px dashed gold border, code left, copy icon +
// "Copy" label right, click-to-copy. Styles are duplicated under the .fs-*
// namespace (FreeSampleSection.css) so this section never depends on the
// spin wheel's stylesheet or the home page's stylesheet being loaded.
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  getBasePx,
} from "../lib/sunrise-components";
import "./FreeSampleSection.css";

const FREE_SAMPLE_CODE = "WEBFREECAN";

type FsCard = {
  slug: string;
  flavor: string;
  descriptor: string;
  color: string;
  tier: 10 | 30 | 60;
  cannabinoid?: "CBG" | "CBN" | "THCV";
  // Explicit name lines when the flavor is 3+ words; the name block reserves
  // exactly two lines so all four cards keep their descriptor/CTA rows aligned.
  nameLines?: string[];
};

// Flavor, descriptor, and color match the PD data in products_.$slug.tsx.
const FS_CARDS: FsCard[] = [
  { slug: "10mg-strawberry", flavor: "Strawberry", descriptor: "Fresh + Fruity", color: "#CC1F39", tier: 10 },
  { slug: "30mg-orange-lemonade", flavor: "Orange Lemonade", descriptor: "Bright + Tart", color: "#FAA819", tier: 30 },
  { slug: "60mg-wild-cherry-peach", flavor: "Wild Cherry Peach", descriptor: "Lush + Juicy", color: "#861625", tier: 60, nameLines: ["Wild Cherry", "Peach"] },
  { slug: "60mg-blackberry-cbn", flavor: "Blackberry", descriptor: "Dark + Smooth", color: "#2E1E3D", tier: 60, cannabinoid: "CBN" },
];

export function FreeSampleSection() {
  const lockupRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cannabinoidRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [copied, setCopied] = useState(false);

  // Paint the cream potency lockups (+ cannabinoid strip) — same sizes as the
  // home S03 cards: 28 mobile / 44 desktop, cannabinoid at base × 0.91.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const lockupBase = window.innerWidth <= 520 ? 28 : 44;
      FS_CARDS.forEach((card, i) => {
        const lockupEl = lockupRefs.current[i];
        if (lockupEl) {
          lockupEl.innerHTML =
            card.tier === 10 ? render10mgLockup(lockupBase, "#FEFBE0") :
            card.tier === 30 ? render30mgLockup(lockupBase, "#FEFBE0") :
                               render60mgLockup(lockupBase, "#FEFBE0");
        }
        const cbEl = cannabinoidRefs.current[i];
        if (cbEl && card.cannabinoid) {
          const cbSize = base * 0.91;
          cbEl.innerHTML =
            card.cannabinoid === "CBG" ? renderCBGLockup(cbSize, "#FEFBE0") :
            card.cannabinoid === "CBN" ? renderCBNLockup(cbSize, "#FEFBE0") :
                                         renderTHCVLockup(cbSize, "#FEFBE0");
        }
      });
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(FREE_SAMPLE_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  return (
    <section className="fs-free-samples">
      <div className="container">
        <h2 className="fs-headline">
          Want a Taste?<br />
          <span className="accent">Just Cover Shipping</span>
        </h2>
        <p className="fs-subhead">
          Add a single can of any flavor or strength to your cart, then enter
          this code at checkout to make it free (you just cover shipping).
          Limit one per order. Cannot be combined with other offers.
        </p>
        <button type="button" className="fs-code" onClick={copyCode} title="Copy code">
          <span className="fs-code-text">{FREE_SAMPLE_CODE}</span>
          <span className="fs-code-copy">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="fs-copy-icon">
              <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {copied ? "Copied!" : "Copy"}
          </span>
        </button>
        <div className="fs-card-grid">
          {FS_CARDS.map((card, i) => (
            <div
              key={card.slug}
              className="fs-card"
              style={{ ["--card-flavor-color" as string]: card.color } as React.CSSProperties}
            >
              <Link to="/products/$slug" params={{ slug: card.slug }} className="fs-card-link">
                <div className="fs-card-can" style={{ background: card.color }}>
                  <img
                    src={`/images/cans/${card.slug}.webp`}
                    alt={`SUNRISE ${card.flavor} ${card.tier}mg hemp-infused THC${card.cannabinoid ? ` + ${card.cannabinoid}` : ""} seltzer can`}
                    width="960"
                    height="1920"
                    loading="lazy"
                  />
                  <span
                    className="fs-card-tier"
                    ref={(el) => { lockupRefs.current[i] = el; }}
                    aria-label={`${card.tier} milligram THC`}
                  />
                  {card.cannabinoid && (
                    <span
                      className="fs-card-cannabinoid"
                      ref={(el) => { cannabinoidRefs.current[i] = el; }}
                      aria-label={`+${card.cannabinoid}`}
                    />
                  )}
                </div>
                <div className="fs-card-meta">
                  <div className="fs-card-name">
                    {(card.nameLines ?? card.flavor.split(" ")).map((word, wi, arr) => (
                      <span key={wi} className="fs-card-name-line">
                        {word}
                        {wi < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </div>
                  <div className="fs-card-descriptor">{card.descriptor}</div>
                </div>
              </Link>
              <div className="fs-card-cta">
                <Link
                  to="/products/$slug"
                  params={{ slug: card.slug }}
                  className="btn btn-flavor"
                  style={{ ["--flavor-color" as string]: card.color } as React.CSSProperties}
                >
                  Try It Free
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
