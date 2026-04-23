// Dynamic route rendering a product detail page for each of the 24 SKUs.
// URL pattern: /products/{tier}mg-{flavor-slug}[-{cannabinoid}]
// Example:     /products/10mg-blackberry-lemonade-cbn

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

// ── HELPERS ──────────────────────────────────────────────────────────────
// Returns 'cream' for dark flavor backgrounds, 'dark' for light ones.
// YIQ perceived-brightness formula, threshold 128. Used to switch text and
// CTA treatment on per-SKU color floods (S05 Cannabinoid, S07 PtP) so cream
// text stays on dark SKUs and near-black text takes over on light ones.
// Without this, light SKUs (Lemonade, Tangerine, Orange Lemonade, Kiwi
// Watermelon, Strawberry Peach, Peach Mango, Blood Orange) fail WCAG AA
// on cream-text bands.
function textModeFor(hex: string): "cream" | "dark" {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "dark" : "cream";
}

// ── HELPERS ──────────────────────────────────────────────────────────────
// Returns 'cream' for dark flavor backgrounds, 'dark' for light ones.
// YIQ perceived-brightness formula, threshold 128. Used to switch text and
// CTA treatment on per-SKU color floods (S05 Cannabinoid, S07 PtP) so cream
// text stays on dark SKUs and near-black text takes over on light ones.
// Without this, light SKUs (Lemonade, Tangerine, Orange Lemonade, Kiwi
// Watermelon, Strawberry Peach, Peach Mango, Blood Orange) fail WCAG AA
// on cream-text bands.
function textModeFor(hex: string): "cream" | "dark" {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "dark" : "cream";
}

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
const CANNABINOID_COPY: Record<Cannabinoid, { name: string; effect: string; description: string }> = {
  CBG: {
    name: "CBG",
    effect: "Focus",
    description:
      "Cannabigerol, often called the 'parent cannabinoid.' Paired with THC, it leans clear-headed — the right profile when the day still has something on its schedule.",
  },
  CBN: {
    name: "CBN",
    effect: "Relax",
    description:
      "Cannabinol develops as THC ages. Paired with THC in a finished drink, it rounds the experience downward — the right profile when the day is winding down.",
  },
  THCV: {
    name: "THCV",
    effect: "Elevate",
    description:
      "Tetrahydrocannabivarin is a rarer minor cannabinoid with a lifted, clear character. Paired with THC, it holds a bright edge — the right profile when the moment has momentum.",
  },
};

function renderLockup(tier: Tier, base: number, color: string): string {
  if (tier === 5) return render5mgLockup(base, color);
  if (tier === 10) return render10mgLockup(base, color);
  if (tier === 30) return render30mgLockup(base, color);
  return render60mgLockup(base, color);
}

// Canonical ingredient list per pitch deck p5 "What's Inside."
// Universal across all 24 SKUs except for the conditional Lemon/Lime Juice
// row — Fresh Lemon Juice appears only on Lemonade SKUs, Fresh Lime Juice
// only on Limeade SKUs. The minor cannabinoid in +CBG / +CBN / +THCV
// variants is covered under Emulsified Hemp Extract and is NOT broken
// out as a separate ingredient. "Cannabis extract" in the original deck
// description is swapped to "hemp extract" to stay compliant with the
// website Voice Guide Never List.
function getIngredients(p: Product): { name: string; note: string }[] {
  const list: { name: string; note: string }[] = [];

  list.push({
    name: "Purified Water",
    note: "Reverse-osmosis filtered water carefully chosen for exceptional hydration and uncompromising flavor.",
  });

  list.push({
    name: "Pure Cane Sugar",
    note: "A touch of real sugar for smooth, naturally derived sweetness.",
  });

  if (p.isLemonade) {
    list.push({
      name: "Fresh Lemon Juice",
      note: "Used exclusively in our Lemonade flavors, this ingredient brings a hint of crisp acidity with a natural citrus lift.",
    });
  }

  if (p.isLimeade) {
    list.push({
      name: "Fresh Lime Juice",
      note: "Used exclusively in our Limeade flavors, this ingredient brings a hint of crisp acidity with a natural citrus lift.",
    });
  }

  list.push({
    name: "Natural Flavoring",
    note: "Sourced from real fruits and botanicals, our flavors deliver bright, authentic notes true to their names.",
  });

  list.push({
    name: "Emulsified Hemp Extract",
    note: "The good stuff — expertly blended hemp extract for a clean and consistent experience with every sip.",
  });

  list.push({
    name: "Natural Enhancers",
    note: "Functional ingredients such as Vitamin B12 that allow for a healthier, more balanced experience without altering flavors.",
  });

  list.push({
    name: "Citric Acid",
    note: "Naturally occurring acid found in citrus fruit that is used to balance flavors and keep things bubbly.",
  });

  list.push({
    name: "Sodium Benzoate",
    note: "Widely used food-safe preservative that helps keep each can fresh without altering its flavor profile.",
  });

  return list;
}

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
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      if (lockupRef.current) {
        lockupRef.current.innerHTML = renderLockup(product.tier, base * 1.2, product.color);
      }
      if (stat12Ref.current) {
        stat12Ref.current.innerHTML = render12ozStatBlock(base * 0.8);
      }
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [product]);

  const othersInTier = PRODUCTS.filter((p) => p.tier === product.tier && p.slug !== product.slug);
  const ingredients = getIngredients(product);
  const halfPoint = Math.ceil(ingredients.length / 2);
  const ingredientsLeft = ingredients.slice(0, halfPoint);
  const ingredientsRight = ingredients.slice(halfPoint);
  const cbCopy = product.cannabinoid ? CANNABINOID_COPY[product.cannabinoid] : null;
  const textMode = textModeFor(product.color);
  const darkTextMod = textMode === "dark" ? " is-dark-text" : "";

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
                {product.cannabinoid && <span> +{product.cannabinoid}</span>}
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
                      <div className="pd-hero-can-variant">+{product.cannabinoid}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="pd-hero-meta">
                {product.cannabinoid && cbCopy && (
                  <div className="pd-variant-pill">
                    <span>{product.tier}mg</span>
                    <span className="pd-variant-dot">·</span>
                    <span>+{product.cannabinoid}</span>
                    <span className="pd-variant-dot">·</span>
                    <span>{cbCopy.effect}</span>
                  </div>
                )}

                <div className="pd-hero-lockup" ref={lockupRef} aria-hidden="true" />

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
                  <a href="#" className="btn btn-primary">Add to Cart →</a>
                  <a href="/find" className="btn btn-secondary">Find Near You</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06 · CANNABINOID STORY (variant only) ─────────────────────── */}
        {product.cannabinoid && cbCopy && (
          <section
            className={`pd-cannabinoid${darkTextMod}`}
            style={{ background: product.color }}
          >
            <div className="container">
              <div className="pd-cannabinoid-grid">
                <div className="pd-cannabinoid-copy">
                  <div className="pd-eyebrow pd-eyebrow-on-color">
                    About the +{product.cannabinoid}
                  </div>
                  <h2 className="pd-cannabinoid-headline">
                    {cbCopy.name}. For{" "}
                    <span className="accent-on-color">{cbCopy.effect.toLowerCase()}.</span>
                  </h2>
                </div>
                <p className="pd-cannabinoid-body">{cbCopy.description}</p>
                <div className="pd-cannabinoid-stats">
                  <div className="pd-cannabinoid-stat">
                    <div className="pd-cannabinoid-stat-value">{product.tier}<span>mg</span></div>
                    <div className="pd-cannabinoid-stat-label">THC per can</div>
                  </div>
                  <div className="pd-cannabinoid-stat">
                    <div className="pd-cannabinoid-stat-value">30<span>mg</span></div>
                    <div className="pd-cannabinoid-stat-label">{product.cannabinoid} per can</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 06 · CANNABINOID STORY (variant only) ─────────────────────── */}
        {product.cannabinoid && cbCopy && (
          <section
            className={`pd-cannabinoid${darkTextMod}`}
            style={{ background: product.color }}
          >
            <div className="container">
              <div className="pd-cannabinoid-grid">
                <div className="pd-cannabinoid-copy">
                  <div className="pd-eyebrow pd-eyebrow-on-color">
                    About the +{product.cannabinoid}
                  </div>
                  <h2 className="pd-cannabinoid-headline">
                    {cbCopy.name}. For{" "}
                    <span className="accent-on-color">{cbCopy.effect.toLowerCase()}.</span>
                  </h2>
                </div>
                <p className="pd-cannabinoid-body">{cbCopy.description}</p>
                <div className="pd-cannabinoid-stats">
                  <div className="pd-cannabinoid-stat">
                    <div className="pd-cannabinoid-stat-value">{product.tier}<span>mg</span></div>
                    <div className="pd-cannabinoid-stat-label">THC per can</div>
                  </div>
                  <div className="pd-cannabinoid-stat">
                    <div className="pd-cannabinoid-stat-value">30<span>mg</span></div>
                    <div className="pd-cannabinoid-stat-label">{product.cannabinoid} per can</div>
                  </div>
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
                <div className="pd-stat-label">Can Size</div>
              </div>
              <div className="pd-claim">
                <svg className="pd-claim-icon" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
                  <line x1="18" y1="62" x2="62" y2="18" stroke="currentColor" strokeWidth="4" />
                  <line x1="40" y1="26" x2="40" y2="56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M40 33 L34 29 M40 33 L46 29 M40 42 L34 38 M40 42 L46 38 M40 51 L34 47 M40 51 L46 47" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <div className="pd-claim-label"><span>Gluten</span><span>Free</span></div>
              </div>
              <div className="pd-claim">
                <svg className="pd-claim-icon" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path d="M40 26 C 30 34, 26 46, 32 56 C 40 50, 44 40, 40 26 Z" fill="currentColor" />
                  <path d="M40 26 C 50 34, 54 46, 48 56 C 40 50, 36 40, 40 26 Z" fill="currentColor" fillOpacity="0.7" />
                </svg>
                <div className="pd-claim-label"><span>Natural</span><span>Vegan</span></div>
              </div>
              <div className="pd-claim">
                <svg className="pd-claim-icon" viewBox="0 0 80 80" aria-hidden="true">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" />
                  <line x1="18" y1="62" x2="62" y2="18" stroke="currentColor" strokeWidth="4" />
                  <rect x="43" y="30" width="8" height="22" fill="currentColor" />
                  <rect x="45" y="26" width="4" height="4" fill="currentColor" />
                  <path d="M28 34 L38 34 L35 44 Q35 48, 31 48 Q27 48, 27 44 Z" fill="currentColor" />
                  <line x1="31" y1="48" x2="31" y2="52" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="pd-claim-label"><span>Zero</span><span>Alcohol</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · OTHERS IN TIER ───────────────────────────────────────── */}
        <section className="pd-related">
          <div className="container">
            <div className="pd-section-head">
              <div className="pd-eyebrow">Also in {product.tier}mg</div>
              <h2 className="pd-section-headline">
                More at your <span className="accent">pace.</span>
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

        {/* ── 04 · INGREDIENTS (home-style trifecta, per-SKU can) ───────── */}
        <section className="pd-ingredients">
          <div className="container">
            <h2 className="pd-inside-headline">What's Inside?</h2>
            <div className="pd-inside-trifecta">
              <div className="pd-inside-col pd-inside-col-left">
                {ingredientsLeft.map((i, idx) => (
                  <div key={idx} className="pd-inside-ing">
                    <div className="pd-inside-ing-name">{i.name}</div>
                    <div className="pd-inside-ing-desc">{i.note}</div>
                  </div>
                ))}
              </div>
              <div className="pd-inside-center">
                {product.imagePath ? (
                  <img
                    className="pd-inside-can"
                    src={product.imagePath}
                    alt={`SUNRISE ${product.flavor} ${product.tier}mg THC hemp-infused seltzer can`}
                    style={{ background: product.color }}
                  />
                ) : (
                  <div className="pd-inside-can pd-inside-can--placeholder" style={{ background: product.color }} aria-hidden="true" />
                )}
              </div>
              <div className="pd-inside-col pd-inside-col-right">
                {ingredientsRight.map((i, idx) => (
                  <div key={idx} className="pd-inside-ing">
                    <div className="pd-inside-ing-name">{i.name}</div>
                    <div className="pd-inside-ing-desc">{i.note}</div>
                  </div>
                ))}
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
                The things people <span className="accent">ask.</span>
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

        {/* ── 08 · PATH TO PURCHASE (red flood, matches About S05) ──────── */}
        <section className="pd-ptp">
          <div className="container">
            <div className="pd-ptp-inner">
              <div className="pd-ptp-copy">
                <h2 className="pd-ptp-headline">
                  Now you know<br />
                  {product.flavor}
                  {product.cannabinoid && <> +{product.cannabinoid}</>}.
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
