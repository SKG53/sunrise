// Dynamic route rendering a product detail page for each of the 24 SKUs.
// URL pattern: /products/{tier}mg-{flavor-slug}[-{cannabinoid}]
// Example:     /products/10mg-blackberry-lemonade-cbn
//
// Section order (visual; code section numbers kept stable for reference):
// 01 Breadcrumb → 02 Hero → 06 Cannabinoid (variant only) → 03 Stat Strip
// → 05 Others in Tier → 04 Ingredients → 07 FAQ → 08 PtP band → Footer

import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  render5mgLockup,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  render12ozStatBlock,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  render30mgCBGLockup,
  render30mgCBNLockup,
  render30mgTHCVLockup,
  getBasePx,
} from "../lib/sunrise-components";
import "./products_.$slug.css";

// ── TYPES ────────────────────────────────────────────────────────────────
type Tier = 5 | 10 | 30 | 60;
type Cannabinoid = "CBG" | "CBN" | "THCV";
type Effect = "FOCUS" | "RELAX" | "ELEVATE";

type Product = {
  slug: string;
  tier: Tier;
  flavor: string;
  descriptor: string;
  blurb: string;
  color: string;           // per-SKU hex from Color Codes
  isLemonade?: boolean;    // adds Fresh Lemon Juice
  isLimeade?: boolean;     // adds Fresh Lime Juice
  cannabinoid?: Cannabinoid;
  effect?: Effect;
  imagePath?: string;      // /images/cans/[file].png once assets land
};

// ── PRODUCT DATA (24 SKUs) ───────────────────────────────────────────────
// Positions 1/2/3 = base flavors; positions 4/5/6 = +CBG / +CBN / +THCV.
// Effect defaults per VIG: CBG=FOCUS, CBN=RELAX, THCV=ELEVATE (can override).
const PRODUCTS: Product[] = [
  // ── 5mg ────────────────────────────────────────────────────────────────
  { slug: "5mg-blackberry", tier: 5, flavor: "Blackberry", descriptor: "Dark + Smooth",
    blurb: "Dark fruit done right. This is blackberry at its best — rich, juicy, and exceptionally smooth.",
    color: "#2E1E3D" },
  { slug: "5mg-blood-orange", tier: 5, flavor: "Blood Orange", descriptor: "Tart + Punchy",
    blurb: "Not your average orange. Blood orange is tart and punchy like no other. You'll know this flavor hits different from the very first sip.",
    color: "#DC7F27" },
  { slug: "5mg-passionfruit-mango", tier: 5, flavor: "Passionfruit Mango", descriptor: "Bright + Breezy",
    blurb: "Passionfruit's zest is paired with mango's silky follow-through. A warm tropical breeze — light, bright, and gone before you know it.",
    color: "#60203A" },
  { slug: "5mg-blueberry-lemonade-cbg", tier: 5, flavor: "Blueberry Lemonade", descriptor: "Rich + Tangy",
    blurb: "Blueberry brings the sweetness. Lemon brings the kick. Rich, tangy, and effortlessly balanced in every single sip.",
    color: "#21285A", isLemonade: true,
    cannabinoid: "CBG", effect: "FOCUS" },
  { slug: "5mg-black-cherry-cbn", tier: 5, flavor: "Black Cherry", descriptor: "Deep + Sweet",
    blurb: "Dark cherry at its finest — sweet, smooth, and full of character. Hits deep and leaves you wanting more.",
    color: "#36121D",
    cannabinoid: "CBN", effect: "RELAX" },
  { slug: "5mg-strawberry-peach-thcv", tier: 5, flavor: "Strawberry Peach", descriptor: "Sweet + Mellow",
    blurb: "Classic strawberry and sun-soaked peach create a soft, mellow blend. Sweet, gentle, and effortlessly lovable.",
    color: "#DD756B",
    cannabinoid: "THCV", effect: "ELEVATE" },

  // ── 10mg ───────────────────────────────────────────────────────────────
  { slug: "10mg-strawberry", tier: 10, flavor: "Strawberry", descriptor: "Fresh + Fruity",
    blurb: "Fresh, fruity, and full of real strawberry character. A classic experience worth reaching for over and over again.",
    color: "#CC1F39" },
  { slug: "10mg-watermelon", tier: 10, flavor: "Watermelon", descriptor: "Sweet + Juicy",
    blurb: "Sweet, juicy, and effortlessly refreshing — watermelon at its most natural. Light and easy with a clean finish.",
    color: "#0A6034" },
  { slug: "10mg-lemonade", tier: 10, flavor: "Lemonade", descriptor: "Crisp + Tangy",
    blurb: "A timeless classic — crisp, tangy, and made with real lemon juice. Bright, clean, and perfectly balanced.",
    color: "#E0AD2C", isLemonade: true },
  { slug: "10mg-tangerine-cbg", tier: 10, flavor: "Tangerine", descriptor: "Bright + Zesty",
    blurb: "Real tangerine flavor — vivid, punchy, and perfectly dialed in. Bright and zesty from the first sip until the can's gone.",
    color: "#F89A1F",
    cannabinoid: "CBG", effect: "FOCUS" },
  { slug: "10mg-blackberry-lemonade-cbn", tier: 10, flavor: "Blackberry Lemonade", descriptor: "Tart + Bold",
    blurb: "Lemonade tartness with blackberry's deep fruit backbone — a bold combination that goes down remarkably easy.",
    color: "#2E1E3D", isLemonade: true,
    cannabinoid: "CBN", effect: "RELAX" },
  { slug: "10mg-blueberry-acai-thcv", tier: 10, flavor: "Blueberry Acai", descriptor: "Rich + Vibrant",
    blurb: "Rich blueberry flavor paired with acai's earthy depth. Exceptionally vibrant, layered, and worth savoring.",
    color: "#21285A",
    cannabinoid: "THCV", effect: "ELEVATE" },

  // ── 30mg ───────────────────────────────────────────────────────────────
  { slug: "30mg-peach-mango", tier: 30, flavor: "Peach Mango", descriptor: "Lush + Tropical",
    blurb: "Golden peach paired with irresistible mango — lush, tropical, and perfectly smooth. Serious depth that keeps you reaching back.",
    color: "#E89B5B" },
  { slug: "30mg-cherry-limeade", tier: 30, flavor: "Cherry Limeade", descriptor: "Tart + Refreshing",
    blurb: "Sweet cherry and tart lime — crisp, refreshing, and effortlessly easy to drink. Hits like the classic you've known forever.",
    color: "#67092A", isLimeade: true },
  { slug: "30mg-orange-lemonade", tier: 30, flavor: "Orange Lemonade", descriptor: "Bright + Tart",
    blurb: "Bright and tart with real citrus depth — orange warmth layered with a lemon kick. Refreshing and built to be savored.",
    color: "#FAA819", isLemonade: true },
  { slug: "30mg-kiwi-watermelon-cbg", tier: 30, flavor: "Kiwi Watermelon", descriptor: "Crisp + Cool",
    blurb: "Crisp kiwi and cool watermelon is a pairing that just makes sense. Smooth and effortless, earning its place on every shelf.",
    color: "#A4BC47",
    cannabinoid: "CBG", effect: "FOCUS" },
  { slug: "30mg-blueberry-pomegranate-cbn", tier: 30, flavor: "Blueberry Pomegranate", descriptor: "Tart + Vibrant",
    blurb: "Pomegranate tartness meets blueberry's rich depth for something vivid, bold, and unmistakable. A finish that stays with you.",
    color: "#21285A",
    cannabinoid: "CBN", effect: "RELAX" },
  { slug: "30mg-strawberry-watermelon-thcv", tier: 30, flavor: "Strawberry Watermelon", descriptor: "Sweet + Fresh",
    blurb: "Strawberry sweetness folds into watermelon's fresh profile. Light, juicy, and effortlessly lovable — two fruits at their best.",
    color: "#0A6034",
    cannabinoid: "THCV", effect: "ELEVATE" },

  // ── 60mg ───────────────────────────────────────────────────────────────
  { slug: "60mg-passionfruit-mango", tier: 60, flavor: "Passionfruit Mango", descriptor: "Bright + Breezy",
    blurb: "Passionfruit's zest is paired with mango's silky follow-through. A warm tropical breeze — light, bright, and gone before you know it.",
    color: "#60203A" },
  { slug: "60mg-wild-cherry-peach", tier: 60, flavor: "Wild Cherry Peach", descriptor: "Lush + Juicy",
    blurb: "Wild cherry depth with peach's raw sweetness. Together, they're lush, juicy, and something you'll savor down to the very last drop.",
    color: "#861625" },
  { slug: "60mg-blueberry-lemonade", tier: 60, flavor: "Blueberry Lemonade", descriptor: "Rich + Tangy",
    blurb: "Blueberry brings the sweetness. Lemon brings the kick. Rich, tangy, and effortlessly balanced in every single sip.",
    color: "#21285A", isLemonade: true },
  { slug: "60mg-blood-orange-cbg", tier: 60, flavor: "Blood Orange", descriptor: "Tart + Punchy",
    blurb: "Not your average orange. Blood orange is tart and punchy like no other. You'll know this flavor hits different from the very first sip.",
    color: "#DC7F27",
    cannabinoid: "CBG", effect: "FOCUS" },
  { slug: "60mg-blackberry-cbn", tier: 60, flavor: "Blackberry", descriptor: "Dark + Smooth",
    blurb: "Dark fruit done right. This is blackberry at its best — rich, juicy, and exceptionally smooth.",
    color: "#2E1E3D",
    cannabinoid: "CBN", effect: "RELAX" },
  { slug: "60mg-strawberry-kiwi-thcv", tier: 60, flavor: "Strawberry Kiwi", descriptor: "Sweet + Tangy",
    blurb: "Strawberry sweetness and kiwi tang in a crisp, invigorating blend. Bright and lively, keeps you coming back for more.",
    color: "#CC1F39",
    cannabinoid: "THCV", effect: "ELEVATE" },
];

// ── HELPERS ──────────────────────────────────────────────────────────────
// Per-cannabinoid copy surfaced in Section 02 (variant SKUs only). "bestFor"
// maps to the small italic subhead; body1/2/3 map to the three stacked
// paragraphs that follow. Content is locked to the SUNRISE +CBG / +CBN /
// +THCV functional copy block.
const CANNABINOID_COPY: Record<Cannabinoid, { bestFor: string; body1: string; body2: string; body3: string }> = {
  CBG: {
    bestFor: "Daytime",
    body1: "Mildly energizing and mood-uplifting.",
    body2: "Enhances mental focus and alertness.",
    body3: "Pairs well with morning or early afternoon consumption.",
  },
  CBN: {
    bestFor: "Nighttime",
    body1: "Gently restful and calming.",
    body2: "Supports better relaxation without heavy sedation.",
    body3: "Pairs well as a late-evening or end-of-shift drink.",
  },
  THCV: {
    bestFor: "Focus & Clarity",
    body1: "Cleanly stimulating and smoothly energizing.",
    body2: "Promotes clear-headed focus and physical motivation.",
    body3: "Pairs well with dynamic adventures or productivity boosts.",
  },
};

function renderLockup(tier: Tier, base: number, color: string): string {
  if (tier === 5) return render5mgLockup(base, color);
  if (tier === 10) return render10mgLockup(base, color);
  if (tier === 30) return render30mgLockup(base, color);
  return render60mgLockup(base, color);
}

// Canonical ingredient list per pitch deck p5 "What's Inside." This section
// is a verbatim replica of home S05 — identical content, identical markup
// pattern, identical styling. Ingredients are hardcoded (not per-SKU) to
// match home exactly.

const FAQS = [
  {
    q: "How much THC is in each can?",
    a: "Each can holds two servings. Total THC per can matches the tier on the front — 5mg, 10mg, 30mg, or 60mg — so per serving is half that number. Start low, go slow.",
  },
  {
    q: "How long does it take to feel an effect?",
    a: "Emulsified Delta-9 hits faster than a standard edible — typically 15 to 30 minutes — and the peak is generally shorter and cleaner. Effects vary by body and setting.",
  },
  {
    q: "What's the difference between the cannabinoid variants?",
    a: "+CBG tracks toward focus, +CBN toward relax, +THCV toward elevate. Each minor cannabinoid is blended at 30mg per can alongside the stated THC dose.",
  },
  {
    q: "Where are the COAs?",
    a: "Every batch is full-panel tested. Scan the QR code on the can or visit the COAs link from any page on the site.",
  },
];

// ── ROUTE ────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/products_/$slug")({
  component: ProductDetailPage,
  loader: ({ params }) => {
    const product = PRODUCTS.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) {
      return {
        meta: [{ title: "Product · SUNRISE" }],
        links: [{ rel: "canonical", href: "https://savorsunrise.com/products" }],
      };
    }
    const variant = p.cannabinoid ? ` +${p.cannabinoid}` : "";
    return {
      meta: [
        { title: `${p.flavor}${variant} · ${p.tier}mg THC · SUNRISE` },
        {
          name: "description",
          content: `${p.flavor}${variant}. ${p.tier}mg THC hemp-infused seltzer. ${p.blurb}`,
        },
      ],
      links: [
        { rel: "canonical", href: `https://savorsunrise.com/products/${p.slug}` },
      ],
    };
  },
});

// ── COMPONENT ────────────────────────────────────────────────────────────
function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const lockupRef = useRef<HTMLDivElement>(null);
  const stat12Ref = useRef<HTMLDivElement>(null);
  // Cannabinoid lockup refs — painted in useEffect below. Each is null on
  // non-variant SKUs (Core flavors have no cannabinoid) and on placeholder
  // paths that don't render that DOM node.
  const bcCbRef = useRef<HTMLSpanElement>(null);            // breadcrumb
  const placeholderCbRef = useRef<HTMLSpanElement>(null);   // hero can placeholder
  const hero30mgCbRef = useRef<HTMLSpanElement>(null);      // hero row: +30mg cannabinoid inline with potency lockup
  const cannabinoidLockupRef = useRef<HTMLSpanElement>(null); // big +CBG/+CBN/+THCV lockup in cannabinoid section
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      if (lockupRef.current) {
        lockupRef.current.innerHTML = renderLockup(product.tier, base * 1.8, product.color);
      }
      if (stat12Ref.current) {
        stat12Ref.current.innerHTML = render12ozStatBlock(base * 2.4);
      }

      // ── Cannabinoid lockups (variant SKUs only) ──────────────────────
      if (!product.cannabinoid) return;
      const cb = product.cannabinoid;
      const plusLockup =
        cb === "CBG"  ? renderCBGLockup  :
        cb === "CBN"  ? renderCBNLockup  :
                        renderTHCVLockup;
      const mg30Lockup =
        cb === "CBG"  ? render30mgCBGLockup  :
        cb === "CBN"  ? render30mgCBNLockup  :
                        render30mgTHCVLockup;

      // Breadcrumb — near-black on cream. Matches .pd-breadcrumb li font-size.
      if (bcCbRef.current) {
        bcCbRef.current.innerHTML = plusLockup(base * 0.30, "#1A1A1A");
      }
      // Hero-can placeholder — cream on flavor-color bg.
      if (placeholderCbRef.current) {
        placeholderCbRef.current.innerHTML = plusLockup(base * 0.28, "#FEFBE0");
      }
      // Hero row: +30mg cannabinoid lockup, flavor color, same base as potency lockup.
      if (hero30mgCbRef.current) {
        hero30mgCbRef.current.innerHTML = mg30Lockup(base * 1.8, product.color);
      }
      // Cannabinoid section big lockup — cream on flavor-color flood.
      if (cannabinoidLockupRef.current) {
        cannabinoidLockupRef.current.innerHTML = plusLockup(base * 2.4, "#FEFBE0");
      }
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [product]);

  const othersInTier = PRODUCTS.filter((p) => p.tier === product.tier && p.slug !== product.slug);
  const cbCopy = product.cannabinoid ? CANNABINOID_COPY[product.cannabinoid] : null;

  return (
    <>
      <SiteHeader activeNav="products" />

      <main>
        {/* ── 01 · BREADCRUMB ───────────────────────────────────────────── */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <div className="container">
            <ol>
              <li><a href="/products">Products</a></li>
              <li aria-hidden="true">·</li>
              <li><a href={`/products?tier=${product.tier}`}>{product.tier}mg</a></li>
              <li aria-hidden="true">·</li>
              <li className="pd-breadcrumb-current">
                {product.flavor}
                {product.cannabinoid && (
                  <>
                    {" "}
                    <span ref={bcCbRef} aria-label={`+${product.cannabinoid}`} />
                  </>
                )}
              </li>
            </ol>
          </div>
        </nav>

        {/* ── 02 · PRODUCT HERO ─────────────────────────────────────────── */}
        <section className="pd-hero">
          <div className="container">
            <div className="pd-hero-grid">
              <div className="pd-hero-can" style={{ background: product.color }}>
                {product.imagePath ? (
                  <img src={product.imagePath} alt={`SUNRISE ${product.flavor} ${product.tier}mg THC hemp-infused seltzer can`} />
                ) : (
                  <div className="pd-hero-can-placeholder">
                    <div className="pd-hero-can-flavor">{product.flavor}</div>
                    <div className="pd-hero-can-sub">{product.tier}mg THC</div>
                    {product.cannabinoid && (
                      <div className="pd-hero-can-variant">
                        <span ref={placeholderCbRef} aria-label={`+${product.cannabinoid}`} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pd-hero-meta">
                <div className="pd-hero-lockup-row">
                  <span className="pd-hero-lockup" ref={lockupRef} aria-hidden="true" />
                  {product.cannabinoid && (
                    <span
                      className="pd-hero-lockup-30mg"
                      ref={hero30mgCbRef}
                      aria-label={`+30mg ${product.cannabinoid}`}
                    />
                  )}
                </div>

                <h1 className="pd-hero-flavor">{product.flavor}</h1>

                <div className="pd-hero-descriptor">{product.descriptor}</div>

                <p className="pd-hero-blurb">{product.blurb}</p>

                <div className="pd-hero-price">
                  <span className="pd-price-amount">$X.XX</span>
                  <span className="pd-price-unit">/ can</span>
                </div>

                <div className="pd-hero-qty">
                  <span className="pd-qty-label">Qty</span>
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="pd-qty-value">{qty}</span>
                  <button
                    type="button"
                    className="pd-qty-btn"
                    onClick={() => setQty(qty + 1)}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <div className="pd-hero-ctas">
                  <a
                    href="#"
                    className="btn btn-flavor"
                    style={{ ["--flavor-color" as string]: product.color } as React.CSSProperties}
                  >
                    Add to Cart →
                  </a>
                  <a href="/find" className="btn btn-secondary">Find Near You</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · CANNABINOID STORY (variant only) ─────────────────────── */}
        {/* Two-column band on flavor-color flood. Left: big +{cannabinoid}   */}
        {/* lockup in cream. Right: italic "Best for {X}" subhead + three     */}
        {/* body lines of functional copy. Stats boxes removed per brand      */}
        {/* direction — the dose information lives on the hero now via the    */}
        {/* potency lockup + inline +30mg cannabinoid lockup pairing.         */}
        {product.cannabinoid && cbCopy && (
          <section
            className="pd-cannabinoid"
            style={{ background: product.color }}
          >
            <div className="container">
              <div className="pd-cannabinoid-grid">
                <div
                  className="pd-cannabinoid-lockup"
                  ref={cannabinoidLockupRef}
                  aria-label={`+${product.cannabinoid}`}
                />
                <div className="pd-cannabinoid-right">
                  <div className="pd-cannabinoid-bestfor">
                    Best for {cbCopy.bestFor}
                  </div>
                  <p className="pd-cannabinoid-body">{cbCopy.body1}</p>
                  <p className="pd-cannabinoid-body">{cbCopy.body2}</p>
                  <p className="pd-cannabinoid-body">{cbCopy.body3}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 03 · STAT STRIP ───────────────────────────────────────────── */}
        <section className="pd-stats">
          <div className="container">
            <div className="pd-stats-grid">
              <div className="pd-stat">
                <div className="pd-stat-lockup" ref={stat12Ref} aria-hidden="true" />
              </div>
              <div className="pd-claim">
                <img
                  className="pd-claim-icon"
                  src="/icons/gluten-free.svg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="pd-claim-label"><span>Gluten</span><span>Free</span></div>
              </div>
              <div className="pd-claim">
                <img
                  className="pd-claim-icon"
                  src="/icons/natural-vegan.svg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="pd-claim-label"><span>Natural</span><span>Vegan</span></div>
              </div>
              <div className="pd-claim">
                <img
                  className="pd-claim-icon"
                  src="/icons/zero-alcohol.svg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="pd-claim-label"><span>Zero</span><span>Alcohol</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · OTHERS IN TIER ───────────────────────────────────────── */}
        <section className="pd-related">
          <div className="container">
            <div className="pd-section-head">
              <h2 className="pd-section-headline">
                Try our other <span className="accent">flavors.</span>
              </h2>
            </div>
            <div className="pd-related-grid">
              {othersInTier.map((o) => (
                <Link
                  key={o.slug}
                  to="/products/$slug"
                  params={{ slug: o.slug }}
                  className="pd-related-card"
                >
                  <div className="pd-related-can" style={{ background: o.color }}>
                    <span>{o.flavor}</span>
                  </div>
                  <div className="pd-related-meta">
                    <div className="pd-related-name">
                      {o.flavor}
                      {o.cannabinoid && <span className="pd-related-variant"> +{o.cannabinoid}</span>}
                    </div>
                    <div className="pd-related-descriptor">{o.descriptor}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 04 · WHAT'S INSIDE ────────────────────────────────────────── */}
        {/* Verbatim replica of home S05 — same markup pattern, same content, */}
        {/* same grey placeholder. Ingredient list is hardcoded (not per-SKU) */}
        {/* and wording mirrors home exactly. Class prefix stays pd-inside-*   */}
        {/* for route-scoped styling; the rules in products_.$slug.css mirror  */}
        {/* home's .s04-whats-inside block one-for-one.                        */}
        <section className="pd-ingredients">
          <div className="container">
            <h2 className="pd-inside-headline">What's Inside?</h2>
            <div className="pd-inside-trifecta">
              <div className="pd-inside-col pd-inside-col-left">
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Purified Water</div>
                  <div className="pd-inside-ing-desc">
                    Reverse-osmosis filtered water carefully chosen for exceptional
                    hydration &amp; uncompromising flavor.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Pure Cane Sugar</div>
                  <div className="pd-inside-ing-desc">
                    A touch of real sugar for smooth, naturally derived sweetness.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Natural Flavoring</div>
                  <div className="pd-inside-ing-desc">
                    Sourced from real fruits and botanicals, our flavors deliver
                    bright, authentic notes true to their names.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Fresh Lemon Juice</div>
                  <div className="pd-inside-ing-desc">
                    Used exclusively in our Lemonade flavors, this ingredient brings
                    a hint of crisp acidity with a natural citrus lift.
                  </div>
                </div>
              </div>
              <div className="pd-inside-center">
                {/* Placeholder center can — swap background for real image */}
                <div className="pd-inside-can-placeholder" aria-hidden="true" />
              </div>
              <div className="pd-inside-col pd-inside-col-right">
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Emulsified Hemp Extract</div>
                  <div className="pd-inside-ing-desc">
                    The good stuff — expertly blended cannabis extract for a clean
                    and consistent experience with every sip.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Naturally Sourced Enhancers</div>
                  <div className="pd-inside-ing-desc">
                    Functional ingredients like B12 that allow for a healthier,
                    more balanced experience without altering flavors.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Citric Acid</div>
                  <div className="pd-inside-ing-desc">
                    A naturally occurring acid found in citrus fruits, this is used
                    to balance flavors and keep things bubbly.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Sodium Benzoate</div>
                  <div className="pd-inside-ing-desc">
                    A widely used food-safe preservative that helps keep each can
                    fresh without altering its flavor profile.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 07 · FAQ ──────────────────────────────────────────────────── */}
        <section className="pd-faq">
          <div className="container">
            <div className="pd-section-head">
              <div className="pd-eyebrow">Questions</div>
              <h2 className="pd-section-headline">
                The things people <span className="accent">ask</span>
              </h2>
            </div>
            <div className="pd-faq-list">
              {FAQS.map((item, idx) => (
                <details key={idx} className="pd-faq-item">
                  <summary className="pd-faq-q">
                    <span>{item.q}</span>
                    <span className="pd-faq-chev" aria-hidden="true">+</span>
                  </summary>
                  <div className="pd-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── 08 · PATH TO PURCHASE (per-SKU flavor color flood) ────────── */}
        <section
          className="pd-ptp"
          style={{
            background: product.color,
            ["--on-color-text" as string]: product.color,
          } as React.CSSProperties}
        >
          <div className="container">
            <div className="pd-ptp-inner">
              <div className="pd-ptp-copy">
                <h2 className="pd-ptp-headline">
                  Now you know<br />
                  {product.flavor}
                </h2>
                <p className="pd-ptp-body">
                  Find one near you or explore other flavors and potencies.
                </p>
              </div>
              <div className="pd-ptp-ctas">
                <a href="#" className="btn btn-on-color">Shop Now →</a>
                <a href="/find" className="btn btn-on-color-ghost">Find Near You →</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
