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
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
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
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/products" },
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
    name: "Subtle Lift",
    short: "Subtle Lift",
    descriptors: "Light · Bright · Casual",
    copy: "First times, mid-week refreshments, or social sessions. Crisp, casual, easy to like.",
    flavors: [
      { name: "Blackberry",          descriptor: "Dark + Smooth",   flavorColor: "#2E1E3D" },
      { name: "Blood Orange",        descriptor: "Tart + Punchy",   flavorColor: "#DC7F27" },
      { name: "Passionfruit Mango",  descriptor: "Bright + Breezy", flavorColor: "#60203A" },
      { name: "Blueberry Lemonade",  descriptor: "Rich + Tangy",    flavorColor: "#21285A", cannabinoid: "CBG" },
      { name: "Black Cherry",        descriptor: "Deep + Sweet",    flavorColor: "#36121D", cannabinoid: "CBN" },
      { name: "Strawberry Peach",    descriptor: "Sweet + Mellow",  flavorColor: "#DD756B", cannabinoid: "THCV" },
    ],
  },
  "10": {
    color: "#CC1F39",
    name: "Perfect Buzz",
    short: "Perfect Buzz",
    descriptors: "Smooth · Balanced · Social",
    copy: "Casual sips, afternoon resets, or social gatherings. The go-to tier — a steady, social lift.",
    flavors: [
      { name: "Strawberry",          descriptor: "Fresh + Fruity",  flavorColor: "#CC1F39" },
      { name: "Watermelon",          descriptor: "Sweet + Juicy",   flavorColor: "#0A6034" },
      { name: "Lemonade",            descriptor: "Crisp + Tangy",   flavorColor: "#E0AD2C" },
      { name: "Tangerine",           descriptor: "Bright + Zesty",  flavorColor: "#F89A1F", cannabinoid: "CBG" },
      { name: "Blackberry Lemonade", descriptor: "Tart + Bold",     flavorColor: "#2E1E3D", cannabinoid: "CBN" },
      { name: "Blueberry Acai",      descriptor: "Rich + Vibrant",  flavorColor: "#21285A", cannabinoid: "THCV" },
    ],
  },
  "30": {
    color: "#0A6034",
    name: "Deeper Dive",
    short: "Deeper Dive",
    descriptors: "Rich · Vibrant · Spirited",
    copy: "Extended sessions, creative inspirations, or evening unwinds. For when the mood calls for something richer.",
    flavors: [
      { name: "Peach Mango",           descriptor: "Lush + Tropical",   flavorColor: "#E89B5B" },
      { name: "Cherry Limeade",        descriptor: "Tart + Refreshing", flavorColor: "#67092A" },
      { name: "Orange Lemonade",       descriptor: "Bright + Tart",     flavorColor: "#FAA819" },
      { name: "Kiwi Watermelon",       descriptor: "Crisp + Cool",      flavorColor: "#A4BC47", cannabinoid: "CBG" },
      { name: "Blueberry Pomegranate", descriptor: "Tart + Vibrant",    flavorColor: "#21285A", cannabinoid: "CBN" },
      { name: "Strawberry Watermelon", descriptor: "Sweet + Fresh",     flavorColor: "#0A6034", cannabinoid: "THCV" },
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
      { name: "Blood Orange",        descriptor: "Tart + Punchy",   flavorColor: "#DC7F27", cannabinoid: "CBG" },
      { name: "Blackberry",          descriptor: "Dark + Smooth",   flavorColor: "#2E1E3D", cannabinoid: "CBN" },
      { name: "Strawberry Kiwi",     descriptor: "Sweet + Tangy",   flavorColor: "#CC1F39", cannabinoid: "THCV" },
    ],
  },
};

// Unified lockup size across all four tiers.
const LOCKUP_SIZE = 2.2;

// Two-word effect phrases shown on flavor-card pills for +CBG / +CBN / +THCV
// variants. Canonical per Brand memory ("+CBG = FOCUS + UPLIFT" etc.). Mirrors
// the eyebrow text on the matching S03 effect cards.
const CANNABINOID_EFFECT: Record<Cannabinoid, string> = {
  CBG:  "Focus + Uplift",
  CBN:  "Relax + Unwind",
  THCV: "Elevate + Engage",
};

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
    body: "Just THC. Clean, balanced, uncomplicated — the SUNRISE baseline.",
    foot: "Three flavors per tier",
  },
  {
    bg: "#DC7F27",
    eyebrow: "Focus · Uplift",
    symbol: "+CBG",
    body: "Cannabigerol. The sharpener. Lifts without pulling focus.",
    foot: "One flavor per tier",
  },
  {
    bg: "#2E1E3D",
    eyebrow: "Relax · Unwind",
    symbol: "+CBN",
    body: "Cannabinol. The settler. Evening weight, softer edges.",
    foot: "One flavor per tier",
  },
  {
    bg: "#CC1F39",
    eyebrow: "Elevate · Engage",
    symbol: "+THCV",
    body: "Tetrahydrocannabivarin. The lift. Cleaner, clearer, forward-leaning.",
    foot: "One flavor per tier",
  },
];

// ── FAQ DATA ─────────────────────────────────────────────────────────────
// SKU-moment questions (dose, onset, variants, ingredients). Intentionally
// disjoint from the broader first-time-visitor FAQs on the home page.
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

  // Effect-card lockup refs (one per cannabinoid card; Core card has no lockup).
  // Array indexed 0-3 to match EFFECTS positions. null when ref not yet attached.
  const effectRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Flavor-corner lockup refs — one per cannabinoid flavor (positions 4–6 of
  // each tier). Repopulated on tier switch via React's ref callback; null
  // slots correspond to base flavors (no cannabinoid).
  const cornerRefs = useRef<(HTMLSpanElement | null)[]>([]);

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

      // ── Switcher button lockups — cream on active tier bg, tier-color on inactive cream bg ──
      (["5", "10", "30", "60"] as TierKey[]).forEach((tier) => {
        const ref = switchRefs[tier].current;
        if (!ref) return;
        const isActive = tier === activeTier;
        const color = isActive ? "#FEFBE0" : TIERS[tier].color;
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

      // ── Effect-card +CBG / +CBN / +THCV lockups — cream on tier bg ──
      // Matches .p-effect-symbol font-size (calc(--base * 1.05)).
      EFFECTS.forEach((e, i) => {
        const ref = effectRefs.current[i];
        if (!ref) return;
        const size = base * 1.05;
        let html = "";
        if (e.symbol === "+CBG")  html = renderCBGLockup(size, "#FEFBE0");
        else if (e.symbol === "+CBN")  html = renderCBNLockup(size, "#FEFBE0");
        else if (e.symbol === "+THCV") html = renderTHCVLockup(size, "#FEFBE0");
        ref.innerHTML = html;
      });

      // ── Flavor-pill +CBG / +CBN / +THCV lockups — cream on tier bg ──
      // Matches .p-flavor-pill font-size (calc(--base * 0.18)).
      TIERS[activeTier].flavors.forEach((f, i) => {
        const ref = pillRefs.current[i];
        if (!ref || !f.cannabinoid) return;
        const size = base * 0.18;
        let html = "";
        if (f.cannabinoid === "CBG")  html = renderCBGLockup(size, "#FEFBE0");
        else if (f.cannabinoid === "CBN")  html = renderCBNLockup(size, "#FEFBE0");
        else if (f.cannabinoid === "THCV") html = renderTHCVLockup(size, "#FEFBE0");
        ref.innerHTML = html;
      });
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
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="p-pagehero">
          <h1 className="p-pagehero-title" aria-label="Products">
            {"Products".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
        <section className="p-hero">
          <div className="container">
            <div className="p-hero-inner">
              <h1 className="p-hero-headline">
                Enjoy every last<br />
                <span className="accent">sip and pour.</span>
              </h1>
              <p className="p-hero-body">
                Try one and try them all. Savor the SUNRISE with each and every one — all made with natural flavors.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 · FIND YOUR EFFECT (4 cards: Core + CBG/CBN/THCV) ─────── */}
        <section className="p-effects">
          <div className="container">
            <h2 className="p-effects-headline">
              Find your <span className="accent">effect</span>
            </h2>
            <p className="p-effects-subhead">
              Every tier offers four paths — a classic THC core, or three enhanced with a minor cannabinoid for a more specific lift.
            </p>
            <div className="p-effects-grid">
              {EFFECTS.map((e, i) => (
                <div key={i} className="p-effect-card" style={{ background: e.bg }}>
                  <div className="p-effect-eyebrow">{e.eyebrow}</div>
                  <div className="p-effect-symbol">
                    {e.symbol.startsWith("+") ? (
                      <span
                        ref={(el) => { effectRefs.current[i] = el; }}
                        aria-label={e.symbol}
                      />
                    ) : (
                      e.symbol
                    )}
                  </div>
                  <div className="p-effect-body">{e.body}</div>
                  <div className="p-effect-foot">{e.foot}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 04 · TIER SWITCHER + PANEL ──────────────────────────────── */}
        <section className="p-switcher">
          <div className="container">
            <h2 className="p-switcher-headline">
              Find your <span className="accent">potency</span>
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
                          <span
                            ref={(el) => { pillRefs.current[i] = el; }}
                            aria-label={`+${f.cannabinoid}`}
                          /> · {f.effect}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · WHAT'S INSIDE ────────────────────────────────────────── */}
        <section className="p-inside">
          <div className="container">
            <div className="p-inside-head">
              <h2 className="p-inside-headline">
                Real ingredients<br />
                Real <span className="accent">effects</span>
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

        {/* ── 06 · TRANSPARENCY ─────────────────────────────────────────── */}
        <section className="p-transparency">
          <div className="container">
            <div className="p-transparency-inner">
              <div className="p-transparency-copy">
                <h2 className="p-transparency-headline">
                  Every batch, <span className="accent">full-panel tested</span>
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

        {/* ── 07 · CTA BAND ─────────────────────────────────────────────── */}
        <section className="p-ptp">
          <div className="container">
            <div className="p-ptp-inner">
              <div className="p-ptp-copy">
                <h2 className="p-ptp-headline">Now you know<br />our products</h2>
                <p className="p-ptp-body">
                  Get to know us, or find a can near you.
                </p>
              </div>
              <div className="p-ptp-ctas">
                <a href="/about" className="btn btn-on-color">Learn About Us →</a>
                <a href="/find" className="btn btn-on-color-ghost">
                  Find Near You →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── 08 · FAQ ──────────────────────────────────────────────────── */}
        <section className="p-faq">
          <div className="container">
            <h2 className="p-faq-headline">
              Frequently <span className="accent">asked</span>
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
