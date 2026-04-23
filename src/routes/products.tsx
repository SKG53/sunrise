// =============================================================================
// SUNRISE — products.tsx
// Path: src/routes/products.tsx
// Session: SBev.BC.WebsiteDesign.AllPages.2 · Products restructure
//
// Change summary vs previous version:
// · Section reorder: Hero → Find Your Effect (promoted from below) → Tier
//   Switcher + Panel → What's Inside (ported from About) → Transparency →
//   Find Near You → FAQ (new, last section before footer)
// · Ticker section removed entirely
// · Find Your Effect: 3 cards → 4 cards (CORE added as the classic THC-only
//   baseline, paired-descriptor "Pure · Classic")
// · Tier switcher buttons: plain "MG" text → real potency lockups per tier
// · Panel head: lockup-right / text-left flipped to lockup-left / text-right
// · Lockup sizes unified at base × 2.2 across all four tiers
//   (previous 5mg ×2.6 bump overcorrected for single-digit visual weight)
// · Descriptor tweaks: 30mg "Bold" → "Rich"; 60mg "Potent · Rich" → "Bold · Potent"
// · 60mg short name: "Elevated" → "Elevated Experience"
// · Hero subhead expanded to acknowledge three-effects axis
// · New: FAQ accordion, 8 product-focused Qs
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  render5mgLockup,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  render12ozStatBlock,
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

// ── SLUG HELPER ──────────────────────────────────────────────────────────
function toSlug(tier: TierKey, flavor: { name: string; cannabinoid?: Cannabinoid }): string {
  const flavorPart = flavor.name.toLowerCase().replace(/\s+/g, "-");
  const variantSuffix = flavor.cannabinoid ? `-${flavor.cannabinoid.toLowerCase()}` : "";
  return `${tier}mg-${flavorPart}${variantSuffix}`;
}

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
    descriptors: "Rich · Vibrant · Spirited",
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
    short: "Elevated Experience",
    descriptors: "Bold · Potent · Immersive",
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

// Unified lockup size across all four tiers. Previous version bumped 5mg to
// 2.6 for single-digit visual weight parity; that overcorrected — 5mg read
// larger than the other tiers. 2.2 is the target for all four.
const LOCKUP_SIZE = 2.2;

// ── EFFECTS DATA (4-card Find Your Effect grid) ──────────────────────────
// Positions: 1 = CORE (classic THC baseline), 2-4 = +CBG / +CBN / +THCV.
type EffectCardData = {
  bg: string;
  eyebrow: string;
  symbol: string;
  body: string;
  foot: string;
};
const EFFECTS: EffectCardData[] = [
  {
    bg: "#1A1A1A",
    eyebrow: "Pure · Classic",
    symbol: "Core",
    body: "Just THC, no minor cannabinoids added. Clean, balanced, uncomplicated — the SUNRISE baseline.",
    foot: "Three flavors per tier",
  },
  {
    bg: "#2E1E3D",
    eyebrow: "Focus · Uplift",
    symbol: "+CBG",
    body: "Cannabigerol. The sharpener. Lifts without pulling focus.",
    foot: "One flavor per tier",
  },
  {
    bg: "#36121D",
    eyebrow: "Relax · Unwind",
    symbol: "+CBN",
    body: "Cannabinol. The settler. Evening weight, softer edges.",
    foot: "One flavor per tier",
  },
  {
    bg: "#DD756B",
    eyebrow: "Elevate · Engage",
    symbol: "+THCV",
    body: "Tetrahydrocannabivarin. The lift. Cleaner, clearer, forward-leaning.",
    foot: "One flavor per tier",
  },
];

// ── FAQ DATA (Products-specific, 8 Qs) ───────────────────────────────────
// Home FAQ will use a broader sibling list in a follow-up patch; format
// (accordion) and layout are shared.
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "How do I pick the right potency?",
    a: "If you've never had a hemp-infused seltzer — or never above 5mg — start with 5MG. One serving is a light, social lift. If you're already comfortable with THC beverages, 10MG is the everyday middle. 30MG and 60MG are for longer sessions and deeper unwinds. Start low, go slow.",
  },
  {
    q: "What's the difference between the base flavors and the ones with +CBG, +CBN, or +THCV?",
    a: "Every tier has six flavors — three base and three enhanced with a minor cannabinoid. CBG leans toward focus and uplift. CBN leans toward relax and unwind. THCV leans toward elevate and engage. The THC dose is identical between the two; the minor cannabinoid shifts the character of the experience.",
  },
  {
    q: "How many servings are in a can?",
    a: "Two. Every SUNRISE can is 12 fl oz and contains two servings. One serving of a 10MG can is 5mg THC. One serving of a 60MG can is 30mg THC. Plan your pour accordingly.",
  },
  {
    q: "Can I mix tiers in one session?",
    a: "We wouldn't recommend it. Stacking a 10MG and a 30MG is around 40mg of THC — a big swing if you paced for 10. Pick a tier and stay with it.",
  },
  {
    q: "What's actually inside a SUNRISE?",
    a: "Purified water, pure cane sugar, natural flavoring, emulsified hemp extract, B12, citric acid, and sodium benzoate. That is the ingredient list. Lemonade and Limeade flavors also contain fresh lemon or lime juice.",
  },
  {
    q: "Is SUNRISE gluten-free, vegan, or allergen-safe?",
    a: "Gluten-free and vegan. Free of the eight major allergens. Manufactured in a facility that handles lemon and lime juice for Lemonade and Limeade varieties.",
  },
  {
    q: "Can I drink SUNRISE on an empty stomach?",
    a: "Yes, but expect a faster onset. Emulsified THC absorbs more quickly without food slowing it down. For your first time with a new tier, eat something first and pace yourself.",
  },
  {
    q: "How should I store my cans?",
    a: "Cool, upright, out of direct sunlight. Heat and sunlight degrade cannabinoids over time. Best-by date printed on every can.",
  },
];

// ── COMPONENT ────────────────────────────────────────────────────────────
function ProductsPage() {
  const [activeTier, setActiveTier] = useState<TierKey>("10");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const panelLockupRef = useRef<HTMLDivElement>(null);
  const stat12Ref = useRef<HTMLDivElement>(null);
  const switch5Ref = useRef<HTMLDivElement>(null);
  const switch10Ref = useRef<HTMLDivElement>(null);
  const switch30Ref = useRef<HTMLDivElement>(null);
  const switch60Ref = useRef<HTMLDivElement>(null);
  const switchRefs: Record<TierKey, RefObject<HTMLDivElement | null>> = {
    "5": switch5Ref,
    "10": switch10Ref,
    "30": switch30Ref,
    "60": switch60Ref,
  };

  // Read ?tier= URL param on mount so Home tier cards (and any other
  // /products?tier=X deep-links) land on the correct panel. Invalid values
  // are silently ignored and the default 10mg panel remains active.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tier");
    if (t === "5" || t === "10" || t === "30" || t === "60") {
      setActiveTier(t);
    }
  }, []);

  // Paint brand-mark slots: panel lockup, four switcher-button lockups,
  // and the 12oz stat block in What's Inside. Runs on mount, on font load,
  // on resize, and when activeTier changes.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();

      // ── Panel lockup — cream on tier bg ──
      if (panelLockupRef.current) {
        const size = base * LOCKUP_SIZE;
        let html = "";
        if (activeTier === "5")  html = render5mgLockup(size, "#FEFBE0");
        if (activeTier === "10") html = render10mgLockup(size, "#FEFBE0");
        if (activeTier === "30") html = render30mgLockup(size, "#FEFBE0");
        if (activeTier === "60") html = render60mgLockup(size, "#FEFBE0");
        panelLockupRef.current.innerHTML = html;
      }

      // ── Switcher button lockups — cream on active tier bg, near-black on inactive cream bg ──
      (["5", "10", "30", "60"] as TierKey[]).forEach((tier) => {
        const ref = switchRefs[tier].current;
        if (!ref) return;
        const isActive = tier === activeTier;
        const color = isActive ? "#FEFBE0" : "#1A1A1A";
        const size = base * 0.9;
        let html = "";
        if (tier === "5")  html = render5mgLockup(size, color);
        if (tier === "10") html = render10mgLockup(size, color);
        if (tier === "30") html = render30mgLockup(size, color);
        if (tier === "60") html = render60mgLockup(size, color);
        ref.innerHTML = html;
      });

      // ── 12oz stat block (same scale as About) ──
      if (stat12Ref.current) {
        stat12Ref.current.innerHTML = render12ozStatBlock(base * 0.95);
      }
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
              Twenty-four flavors. Four tiers. Three effects. From a light lift
              to a full experience — find the SUNRISE that fits.
            </p>
          </div>
        </section>

        {/* ── 02 · FIND YOUR EFFECT (4 cards: Core + CBG/CBN/THCV) ─────── */}
        <section className="p-effects">
          <div className="container">
            <h2 className="p-effects-headline">
              Find your <span className="accent">effect.</span>
            </h2>
            <p className="p-effects-subhead">
              Every tier offers four paths — a classic THC core, or three enhanced with a minor cannabinoid for a more specific lift.
            </p>
            <div className="p-effects-grid">
              {EFFECTS.map((e, i) => (
                <div key={i} className="p-effect-card" style={{ background: e.bg }}>
                  <div className="p-effect-eyebrow">{e.eyebrow}</div>
                  <div className="p-effect-symbol">{e.symbol}</div>
                  <div className="p-effect-body">{e.body}</div>
                  <div className="p-effect-foot">{e.foot}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 03 · TIER SWITCHER + PANEL ──────────────────────────────── */}
        <section className="p-switcher">
          <div className="container">
            <h2 className="p-switcher-headline">
              Find your <span className="accent">potency.</span>
            </h2>
            <p className="p-switcher-subhead">
              Six flavors per tier. Tap a tier to explore.
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
                  <div className="p-switch-lockup" ref={switchRefs[k]} />
                  <div className="p-switch-name">{TIERS[k].short}</div>
                </button>
              ))}
            </div>

            <div className="p-panel" style={{ background: tier.color }}>
              <div className="p-panel-head">
                <div className="p-panel-lockup" ref={panelLockupRef} />
                <div className="p-panel-head-text">
                  <div className="p-panel-eyebrow">{tier.descriptors}</div>
                  <h3 className="p-panel-tier-name">{tier.name}</h3>
                  <p className="p-panel-copy">{tier.copy}</p>
                </div>
              </div>

              <div className="p-flavor-grid">
                {tier.flavors.map((f, i) => (
                  <a
                    key={i}
                    href={`/products/${toSlug(activeTier, f)}`}
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

        {/* ── 04 · WHAT'S INSIDE (ported from About S05) ────────────────── */}
        <section className="p-inside">
          <div className="container">
            <div className="p-inside-head">
              <h2 className="p-inside-headline">
                Real ingredients.<br />
                Real <span className="accent">effects.</span>
              </h2>
              <p className="p-inside-lead">
                Every SUNRISE seltzer starts with real fruit, pure cane sugar, and hemp extract
                emulsified in small batches — nothing artificial, nothing you can't pronounce.
              </p>
            </div>

            <div className="p-inside-pillars">
              <div className="p-inside-pillar">
                <div className="p-inside-pillar-title">Flavor</div>
                <p className="p-inside-pillar-body">
                  Real, natural fruit and pure cane sugar. A crisp, mid-calorie profile
                  that tastes as good as it looks — no artificial sweeteners, no shortcuts.
                </p>
              </div>
              <div className="p-inside-pillar">
                <div className="p-inside-pillar-title">Consistency</div>
                <p className="p-inside-pillar-body">
                  Expertly emulsified hemp extracts deliver a reliable experience every
                  single time. Can to can, batch to batch, sip to sip.
                </p>
              </div>
              <div className="p-inside-pillar">
                <div className="p-inside-pillar-title">Transparency</div>
                <p className="p-inside-pillar-body">
                  Certified production facilities and third-party full-panel testing
                  ensure every can is perfectly dosed and fully compliant.
                </p>
              </div>
            </div>

            <div className="p-inside-stats">
              <div className="p-inside-stats-stat" ref={stat12Ref} />
              <div className="p-inside-stats-badges">
                <div className="p-inside-badge">Natural Vegan</div>
                <div className="p-inside-badge">Gluten Free</div>
                <div className="p-inside-badge">Zero Alcohol</div>
                <div className="p-inside-badge">Infused with B12</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · TRANSPARENCY (unchanged) ─────────────────────────────── */}
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

        {/* ── 06 · FIND NEAR YOU BAND (unchanged) ──────────────────────── */}
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

        {/* ── 07 · FAQ (new, last section before footer) ──────────────── */}
        <section className="p-faq">
          <div className="container">
            <h2 className="p-faq-headline">
              Frequently <span className="accent">asked.</span>
            </h2>
            <p className="p-faq-subhead">
              The questions shoppers actually ask. If yours isn't here, reach us at hello@savorsunrise.com.
            </p>
            <div className="p-faq-list">
              {FAQS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i} className={"p-faq-item" + (isOpen ? " open" : "")}>
                    <button
                      type="button"
                      className="p-faq-q"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                    >
                      <span className="p-faq-q-text">{item.q}</span>
                      <span className="p-faq-q-icon" aria-hidden="true">+</span>
                    </button>
                    <div className="p-faq-a">
                      <div className="p-faq-a-inner">{item.a}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
