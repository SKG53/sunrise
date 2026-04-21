// =============================================================================
// SUNRISE — products.tsx
// Path: src/routes/products.tsx
// Session: SBev.BC.WebsiteDesign.Products.1 · Products route — full build
//
// OVERWRITES the scaffolded placeholder.
// Data is canonical from SUNRISE Product Architecture Guide v5 + Color Codes xlsx.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  render5mgLockup,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  getBasePx,
} from "../lib/sunrise-components";
import "./products.css";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products · SUNRISE" },
      {
        name: "description",
        content:
          "Twenty-four hemp-infused seltzer flavors across four potency tiers: 5mg, 10mg, 30mg, and 60mg THC. Real fruit, pure cane sugar, federally-legal Delta-9.",
      },
    ],
  }),
});

// ── TYPES ────────────────────────────────────────────────────────────────
type TierKey = "5" | "10" | "30" | "60";
type Cannabinoid = "CBG" | "CBN" | "THCV";

type Flavor = {
  name: string;
  descriptor: string;
  flavorColor: string;
  cannabinoid?: Cannabinoid;
  effect?: string;
};

type TierData = {
  color: string;
  name: string;
  short: string;
  descriptors: string;
  copy: string;
  flavors: Flavor[];
};

// ── CANONICAL DATA ───────────────────────────────────────────────────────
// Source: PAG v5 + Color Codes xlsx. Positions 1-3 = base, 4-6 = +CBG/+CBN/+THCV.
const TIERS: Record<TierKey, TierData> = {
  "5": {
    color: "#DC7F27",
    name: "A Subtle Lift",
    short: "Subtle Lift",
    descriptors: "Light · Bright · Casual",
    copy: "First times, mid-week refreshments, or social sessions. Crisp, casual, easy to like.",
    flavors: [
      { name: "Blackberry",          descriptor: "Dark + Smooth",   flavorColor: "#2E1E3D" },
      { name: "Blood Orange",        descriptor: "Tart + Punchy",   flavorColor: "#DC7F27" },
      { name: "Passionfruit Mango",  descriptor: "Bright + Breezy", flavorColor: "#60203A" },
      { name: "Blueberry Lemonade",  descriptor: "Rich + Tangy",    flavorColor: "#21285A", cannabinoid: "CBG",  effect: "FOCUS"   },
      { name: "Black Cherry",        descriptor: "Deep + Sweet",    flavorColor: "#36121D", cannabinoid: "CBN",  effect: "RELAX"   },
      { name: "Strawberry Peach",    descriptor: "Sweet + Mellow",  flavorColor: "#DD756B", cannabinoid: "THCV", effect: "ELEVATE" },
    ],
  },
  "10": {
    color: "#CC1F39",
    name: "The Perfect Buzz",
    short: "Perfect Buzz",
    descriptors: "Smooth · Balanced · Social",
    copy: "Casual sips, afternoon resets, or social gatherings. The go-to tier — a steady, social lift.",
    flavors: [
      { name: "Strawberry",          descriptor: "Fresh + Fruity",  flavorColor: "#CC1F39" },
      { name: "Watermelon",          descriptor: "Sweet + Juicy",   flavorColor: "#0A6034" },
      { name: "Lemonade",            descriptor: "Crisp + Tangy",   flavorColor: "#E0AD2C" },
      { name: "Tangerine",           descriptor: "Bright + Zesty",  flavorColor: "#F89A1F", cannabinoid: "CBG",  effect: "FOCUS"   },
      { name: "Blackberry Lemonade", descriptor: "Tart + Bold",     flavorColor: "#2E1E3D", cannabinoid: "CBN",  effect: "RELAX"   },
      { name: "Blueberry Acai",      descriptor: "Rich + Vibrant",  flavorColor: "#21285A", cannabinoid: "THCV", effect: "ELEVATE" },
    ],
  },
  "30": {
    color: "#0A6034",
    name: "A Deeper Dive",
    short: "Deeper Dive",
    descriptors: "Bold · Vibrant · Spirited",
    copy: "Extended sessions, creative inspirations, or evening unwinds. For when the mood calls for something richer.",
    flavors: [
      { name: "Peach Mango",           descriptor: "Lush + Tropical",   flavorColor: "#E89B5B" },
      { name: "Cherry Limeade",        descriptor: "Tart + Refreshing", flavorColor: "#67092A" },
      { name: "Orange Lemonade",       descriptor: "Bright + Tart",     flavorColor: "#FAA819" },
      { name: "Kiwi Watermelon",       descriptor: "Crisp + Cool",      flavorColor: "#A4BC47", cannabinoid: "CBG",  effect: "FOCUS"   },
      { name: "Blueberry Pomegranate", descriptor: "Tart + Vibrant",    flavorColor: "#21285A", cannabinoid: "CBN",  effect: "RELAX"   },
      { name: "Strawberry Watermelon", descriptor: "Sweet + Fresh",     flavorColor: "#0A6034", cannabinoid: "THCV", effect: "ELEVATE" },
    ],
  },
  "60": {
    color: "#2E1E3D",
    name: "Elevated Experience",
    short: "Elevated",
    descriptors: "Potent · Rich · Immersive",
    copy: "Late nights, deep decompressions, or weekend relaxation. The full expression — patience and respect required.",
    flavors: [
      { name: "Passionfruit Mango",  descriptor: "Bright + Breezy", flavorColor: "#60203A" },
      { name: "Wild Cherry Peach",   descriptor: "Lush + Juicy",    flavorColor: "#861625" },
      { name: "Blueberry Lemonade",  descriptor: "Rich + Tangy",    flavorColor: "#21285A" },
      { name: "Blood Orange",        descriptor: "Tart + Punchy",   flavorColor: "#DC7F27", cannabinoid: "CBG",  effect: "FOCUS"   },
      { name: "Blackberry",          descriptor: "Dark + Smooth",   flavorColor: "#2E1E3D", cannabinoid: "CBN",  effect: "RELAX"   },
      { name: "Strawberry Kiwi",     descriptor: "Sweet + Tangy",   flavorColor: "#CC1F39", cannabinoid: "THCV", effect: "ELEVATE" },
    ],
  },
};

// 5mg lockup bumped 18% to correct for single-digit visual weight parity.
const LOCKUP_SIZES: Record<TierKey, number> = {
  "5": 2.6,
  "10": 2.2,
  "30": 2.2,
  "60": 2.2,
};

// ── COMPONENT ────────────────────────────────────────────────────────────
function ProductsPage() {
  const [activeTier, setActiveTier] = useState<TierKey>("10");
  const lockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paint = () => {
      if (!lockupRef.current) return;
      const base = getBasePx();
      const size = base * LOCKUP_SIZES[activeTier];
      const color = "#FEFBE0";
      let html = "";
      if (activeTier === "5")  html = render5mgLockup(size, color);
      if (activeTier === "10") html = render10mgLockup(size, color);
      if (activeTier === "30") html = render30mgLockup(size, color);
      if (activeTier === "60") html = render60mgLockup(size, color);
      lockupRef.current.innerHTML = html;
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [activeTier]);

  const tier = TIERS[activeTier];

  return (
    <>
      <SiteHeader activeNav="products" />

      <main>
        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="p-hero">
          <div className="container">
            <h1 className="p-hero-headline">
              Pick your<br />pace.
            </h1>
            <p className="p-hero-body">
              Twenty-four flavors across four potency tiers. From a light lift
              to a full experience — find the SUNRISE that fits.
            </p>
          </div>
        </section>

        {/* ── 02 · TIER SWITCHER + PANEL ────────────────────────────────── */}
        <section className="p-switcher">
          <div className="container">
            <h2 className="p-switcher-headline">
              Find your <span className="accent">potency.</span>
            </h2>
            <p className="p-switcher-subhead">
              Every tier carries six flavors — three base, three enhanced with a minor cannabinoid. Tap a tier to explore.
            </p>

            <div className="p-switcher-bar">
              {(["5", "10", "30", "60"] as TierKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={"p-switch" + (activeTier === k ? " active" : "")}
                  onClick={() => setActiveTier(k)}
                  style={activeTier === k ? { background: TIERS[k].color } : undefined}
                  aria-pressed={activeTier === k}
                >
                  <div className="p-switch-mg">{k}MG</div>
                  <div className="p-switch-name">{TIERS[k].short}</div>
                </button>
              ))}
            </div>

            <div className="p-panel" style={{ background: tier.color }}>
              <div className="p-panel-head">
                <div className="p-panel-head-text">
                  <div className="p-panel-eyebrow">{tier.descriptors}</div>
                  <h3 className="p-panel-tier-name">{tier.name}</h3>
                  <p className="p-panel-copy">{tier.copy}</p>
                </div>
                <div className="p-panel-lockup" ref={lockupRef} />
              </div>

              <div className="p-flavor-grid">
                {tier.flavors.map((f, i) => (
                  <a
                    key={i}
                    href="#"
                    className="p-flavor-card"
                    aria-label={`${f.name} — ${tier.name}${f.cannabinoid ? ` with ${f.cannabinoid}` : ""}`}
                  >
                    <div className="p-flavor-can" />
                    <div className="p-flavor-meta">
                      <div className="p-flavor-name">{f.name}</div>
                      <div className="p-flavor-descriptor">{f.descriptor}</div>
                      {f.cannabinoid && (
                        <div className="p-flavor-pill">
                          +{f.cannabinoid} · {f.effect}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · MINOR CANNABINOIDS ───────────────────────────────────── */}
        <section className="p-cannabinoids">
          <div className="container">
            <h2 className="p-cannabinoids-headline">
              Find your <span className="accent">effect.</span>
            </h2>
            <p className="p-cannabinoids-subhead">
              Select flavors in every tier carry a minor cannabinoid — CBG, CBN, or THCV — for a nuanced lift beyond THC alone.
            </p>
            <div className="p-cannabinoid-grid">
              <div className="p-cannabinoid-card" style={{ background: "#2E1E3D" }}>
                <div className="p-cannabinoid-eyebrow">Focus · Uplift</div>
                <div className="p-cannabinoid-symbol">+CBG</div>
                <div className="p-cannabinoid-body">
                  Cannabigerol. The sharpener. Lifts without pulling focus.
                </div>
                <div className="p-cannabinoid-foot">In select flavors · all tiers</div>
              </div>
              <div className="p-cannabinoid-card" style={{ background: "#36121D" }}>
                <div className="p-cannabinoid-eyebrow">Relax · Unwind</div>
                <div className="p-cannabinoid-symbol">+CBN</div>
                <div className="p-cannabinoid-body">
                  Cannabinol. The settler. Evening weight, softer edges.
                </div>
                <div className="p-cannabinoid-foot">In select flavors · all tiers</div>
              </div>
              <div className="p-cannabinoid-card" style={{ background: "#DD756B" }}>
                <div className="p-cannabinoid-eyebrow">Elevate · Engage</div>
                <div className="p-cannabinoid-symbol">+THCV</div>
                <div className="p-cannabinoid-body">
                  Tetrahydrocannabivarin. The lift. Cleaner, clearer, forward-leaning.
                </div>
                <div className="p-cannabinoid-foot">In select flavors · all tiers</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · MARQUEE TICKER ───────────────────────────────────────── */}
        <section className="p-ticker" aria-hidden="true">
          <div className="p-ticker-track">
            {[1, 2].map((loop) => (
              <span key={loop} style={{ display: "contents" }}>
                <span>24 Flavors</span><span className="p-ticker-dot" />
                <span>4 Potencies</span><span className="p-ticker-dot" />
                <span>12 Fl Oz</span><span className="p-ticker-dot" />
                <span>Full-Panel Tested</span><span className="p-ticker-dot" />
                <span>Zero Alcohol</span><span className="p-ticker-dot" />
                <span>Infused with B12</span><span className="p-ticker-dot" />
                <span>Made in USA</span><span className="p-ticker-dot" />
              </span>
            ))}
          </div>
        </section>

        {/* ── 05 · TRANSPARENCY ─────────────────────────────────────────── */}
        <section className="p-transparency">
          <div className="container">
            <div className="p-transparency-inner">
              <div className="p-transparency-copy">
                <h2 className="p-transparency-headline">
                  Every batch, <span className="accent">full-panel tested.</span>
                </h2>
                <p className="p-transparency-body">
                  Purified water, pure cane sugar, real fruit flavoring, emulsified
                  hemp extract, B12. Nothing to hide. See the full breakdown or
                  pull any flavor's COA — cannabinoid content, contaminant screen,
                  batch and date.
                </p>
              </div>
              <div className="p-transparency-ctas">
                <a href="/#whats-inside" className="btn btn-secondary">
                  Full Ingredient Breakdown →
                </a>
                <a href="#" className="btn btn-secondary">
                  Download COAs →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · FIND NEAR YOU BAND (reusable element — plum) ─────────── */}
        <section className="p-ptp">
          <div className="container">
            <div className="p-ptp-inner">
              <div className="p-ptp-copy">
                <h2 className="p-ptp-headline">Find it near you.</h2>
                <p className="p-ptp-body">
                  SUNRISE is popping up at retailers across the country. Check the locator to find your nearest store.
                </p>
              </div>
              <div className="p-ptp-ctas">
                <a href="/find" className="btn btn-on-color">
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
