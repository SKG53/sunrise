// Dynamic route rendering a product detail page for each of the 24 SKUs.
// URL pattern: /products/{tier}mg-{flavor-slug}[-{cannabinoid}]
// Example:     /products/10mg-blackberry-lemonade-cbn
//
// Section order (visual; code section numbers kept stable for reference):
// 01 Breadcrumb → 02 Hero → 06 Cannabinoid (variant only) → 03 Stat Strip
// → 05 Others in Tier → 04 Ingredients → 07 FAQ → 08 PtP band → Footer

import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — DO NOT DELETE
  // render5mgLockup,
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
import { CannabinoidIcon } from "../components/CannabinoidIcon";
import { getShopifyMapping } from "@/lib/shopifyProductMap";
import { useShopifyProduct } from "@/hooks/useShopifyProduct";
import { useCartStore } from "@/stores/cartStore";
// PD claim-strip icons — imported as raw SVG strings so they can be inlined
// via dangerouslySetInnerHTML. The src/ versions use `fill: currentColor` for
// the icon shape (cls-2), letting the parent's CSS `color` drive per-flavor
// recoloring at runtime. The wordmark text inside (cls-1) stays dark gray as
// authored. Originals in public/icons/ are unchanged.
import glutenFreeSvgFull from "@/assets/icons/gluten-free.svg?raw";
import naturalVeganSvgFull from "@/assets/icons/natural-vegan.svg?raw";
import zeroAlcoholSvgFull from "@/assets/icons/zero-alcohol.svg?raw";

// Each claim-badge SVG is authored as one 3000×3000 composition with the
// icon graphic (cls-2 paths, top) stacked above the wordmark text (cls-1
// paths, bottom). For the flavor-color stat strip we want them side-by-
// side, not stacked — and the wordmark text needs to read cream against
// the flavor flood. We achieve both without touching the source SVGs by
// rendering each file twice with different viewBox crops: once tight to
// the icon's bounding box, once tight to the wordmark's bounding box.
// Bounds were measured via svgelements; per-file text bounds are required
// because wordmark widths vary (gluten-free 1305, zero-alcohol 1515,
// natural-vegan 1734) but icon bounds are nearly identical across files.
// The cls-1 wordmark paths carry a hardcoded `fill: #424241` inside the
// SVG's <style> block, so the same crop helper rewrites that to
// `currentColor` — cream then cascades from the container's color rule
// without needing an !important CSS override.
function cropClaimSvg(raw: string, viewBox: string): string {
  return raw
    .replace(/viewBox="0 0 3000 3000"/, `viewBox="${viewBox}"`)
    .replace(/fill:\s*#424241/g, "fill: currentColor");
}
const ICON_VIEWBOX = "780 370 1440 1440";
const glutenFreeIcon    = cropClaimSvg(glutenFreeSvgFull,    ICON_VIEWBOX);
const naturalVeganIcon  = cropClaimSvg(naturalVeganSvgFull,  ICON_VIEWBOX);
const zeroAlcoholIcon   = cropClaimSvg(zeroAlcoholSvgFull,   "780 375 1440 1420");
const glutenFreeText    = cropClaimSvg(glutenFreeSvgFull,    "840 1955 1320 680");
const naturalVeganText  = cropClaimSvg(naturalVeganSvgFull,  "625 1955 1750 680");
const zeroAlcoholText   = cropClaimSvg(zeroAlcoholSvgFull,   "735 1950 1530 680");
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

// ── ACTIVE POTENCY CLEANUP FLAG ───────────────────────────────────────
// 2026-05-08: When false, hides non-live SKUs (5mg tier, 30mg tier,
// 60mg Wild Cherry Peach, and 10mg cannabinoid variants) from the user-
// facing site for active potency cleanup. The route loader
// throws notFound() for any non-live slug when the flag is off, so direct
// URL access (e.g. /products/5mg-blackberry) returns 404 rather than
// rendering a real PD page. Reverse: change false → true and uncomment
// the related code blocks marked with the matching tag throughout this
// file. See docs/active-potency-cleanup-2026-05-08.md.
const SHOW_NON_LIVE_PRODUCTS = false;

const LIVE_SLUGS = new Set<string>([
  "10mg-strawberry",
  "10mg-watermelon",
  "10mg-lemonade",
  "30mg-peach-mango",
  "30mg-cherry-limeade",
  "30mg-orange-lemonade",
  "30mg-kiwi-watermelon-cbg",
  "30mg-blueberry-pomegranate-cbn",
  "30mg-strawberry-watermelon-thcv",
  "60mg-wild-cherry-peach",
  "60mg-blueberry-lemonade",
  "60mg-passionfruit-mango",
  "60mg-blood-orange-cbg",
  "60mg-blackberry-cbn",
  "60mg-strawberry-kiwi-thcv",
]);

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

// Two-word effect phrases were previously surfaced on related-card pills
// (Focus + Uplift / Relax + Unwind / Elevate + Engage). Pills were removed
// per founder direction — the rotated +CBG/+CBN/+THCV lockup on the card's
// right edge now carries that information visually. The CANNABINOID_EFFECT
// map is preserved on /products (p-flavor-pill) and remains available for
// future PD reuse if a copy block reintroduces effect language.

function renderLockup(tier: Tier, base: number, color: string): string {
  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — DO NOT DELETE
  // if (tier === 5) return render5mgLockup(base, color);
  if (tier === 10) return render10mgLockup(base, color);
  if (tier === 30) return render30mgLockup(base, color);
  return render60mgLockup(base, color);
}

// Canonical ingredient list per pitch deck p5 "What's Inside." This section
// is a verbatim replica of home S05 — identical content, identical markup
// pattern, identical styling. Ingredients are hardcoded (not per-SKU) to
// match home exactly.

// ── FAQ DATA ─────────────────────────────────────────────────────────────
// PDP shows three FAQs at point-of-purchase. Base flavors (Core SKUs) get
// a format-justification question and an empty-stomach practical question.
// Variant SKUs (+CBG / +CBN / +THCV) get cannabinoid education questions
// instead — appropriate to the shopper context, and also reduces duplicate-
// content overlap across the 24 PDP URLs. Both groups close on the same
// lab-testing trust question. Selection is by product.cannabinoid presence,
// so all 24 SKUs (live + non-live) are covered automatically. Copy locked
// to v6 of canonical /faq master.
const FAQS_BASE: Array<{ q: string; a: string }> = [
  {
    q: "Why is this different from a gummy or edible?",
    a: "Emulsion and absorption. The Delta-9 THC in our seltzers is emulsified into microscopic droplets, which lets your body absorb it faster and more consistently than a typical gummy. That means onset around 30 to 40 minutes instead of 60 to 90, and a cleaner taper on the way out.",
  },
  {
    q: "Can I drink on an empty stomach?",
    a: "You can, though without food the THC tends to absorb faster and the lift can arrive in a less predictable way. Eating something first lets you pace yourself and helps make for a more comfortable experience.",
  },
  {
    q: "Is the product third-party lab tested?",
    a: "Every batch. Full-panel testing by an accredited third-party lab covers cannabinoid potency and contaminants. Scan the QR code on any can to visit our website and navigate to the COAs page, where you can pull up the Certificate of Analysis for that batch.",
  },
];

const FAQS_VARIANT: Array<{ q: string; a: string }> = [
  {
    q: "What are CBG, CBN, and THCV?",
    a: "Minor cannabinoids — the supporting cast alongside Delta-9 THC. CBG tracks toward focus and uplift, CBN toward relaxation and unwinding, THCV toward clarity and engagement. Every variant in the lineup blends 30mg of one of these alongside the stated Delta-9 dose, shifting the character of the experience without changing the THC level.",
  },
  {
    q: "How does THC actually work in the body?",
    a: "THC and other cannabinoids work through the endocannabinoid system — a network of receptors in the brain and body that helps regulate mood, appetite, pain, and sleep. THC binds to those receptors (mainly the ones called CB1 and CB2) to produce the lift. Receptor density and tolerance vary by person, which is why the same can can feel different from one body to another.",
  },
  {
    q: "Is the product third-party lab tested?",
    a: "Every batch. Full-panel testing by an accredited third-party lab covers cannabinoid potency and contaminants. Scan the QR code on any can to visit our website and navigate to the COAs page, where you can pull up the Certificate of Analysis for that batch.",
  },
];

function getFaqsForProduct(p: Product): Array<{ q: string; a: string }> {
  return p.cannabinoid ? FAQS_VARIANT : FAQS_BASE;
}

// ── ROUTE ────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/products_/$slug")({
  component: ProductDetailPage,
  loader: ({ params }) => {
    // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — non-live slugs return 404
    // Reverse: flip SHOW_NON_LIVE_PRODUCTS to true to lift the guard.
    if (!SHOW_NON_LIVE_PRODUCTS && !LIVE_SLUGS.has(params.slug)) {
      throw notFound();
    }
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
  const cannabinoidLockupRef = useRef<HTMLDivElement>(null); // big +30 MG / CBG potency lockup in S02 cannabinoid section
  // Related-card corner lockups — one slot per "Others in Tier" card. Null
  // entries correspond to base-flavor siblings (no cannabinoid). Repopulated
  // via React's ref callback whenever the SKU (and therefore the sibling
  // list) changes.
  const relatedCornerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [qty, setQty] = useState(1);
  const [blurbExpanded, setBlurbExpanded] = useState(false);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      // Defensive: lockupRef no longer points to a rendered node (the potency
      // lockup was removed from S01). Branch is a no-op since current is null.
      // Wiring kept for fast revival if the lockup needs to return.
      if (lockupRef.current) {
        lockupRef.current.innerHTML = renderLockup(product.tier, base * 1.8, product.color);
      }
      if (stat12Ref.current) {
        // Cream "12" against the flavor-color stat-strip background. The
        // brand-locked render12ozStatBlock hardcodes "OUNCE" and "CAN" to
        // #1A1A1A internally; route CSS overrides those inline colors to
        // cream via `.pd-stats .pd-stat-lockup *` so the whole composed
        // lockup reads as a single cream unit on the flavor flood. The
        // function output is unchanged — only its display-layer color is
        // adapted to this surface's contrast needs.
        stat12Ref.current.innerHTML = render12ozStatBlock(base * 2.64, "#FEFBE0");
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
      // S02 cannabinoid section: full +30 MG / CBG potency lockup in cream
      // against the flavor-color flood. The icon (rendered as a sibling
      // React element, not painted here) sits to its left as a co-anchor.
      if (cannabinoidLockupRef.current) {
        cannabinoidLockupRef.current.innerHTML = mg30Lockup(base * 1.8, "#FEFBE0");
      }
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [product]);

  // HIDDEN FOR ACTIVE POTENCY CLEANUP 2026-05-08 — only live siblings render in "Others in Tier"
  const othersInTier = PRODUCTS.filter((p) =>
    p.tier === product.tier &&
    p.slug !== product.slug &&
    (SHOW_NON_LIVE_PRODUCTS || LIVE_SLUGS.has(p.slug))
  );
  const cbCopy = product.cannabinoid
    ? CANNABINOID_COPY[product.cannabinoid as Cannabinoid]
    : null;

  // Paint related-card cannabinoid corner lockups. Runs after the related
  // grid renders (othersInTier in deps) so refs are attached. Only variant
  // siblings get a lockup; base-flavor refs stay null.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      othersInTier.forEach((o, i) => {
        const ref = relatedCornerRefs.current[i];
        if (!ref || !o.cannabinoid) return;
        const size = base * 0.91;
        const html =
          o.cannabinoid === "CBG"  ? renderCBGLockup(size, "#FEFBE0")  :
          o.cannabinoid === "CBN"  ? renderCBNLockup(size, "#FEFBE0")  :
                                     renderTHCVLockup(size, "#FEFBE0");
        ref.innerHTML = html;
      });
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [othersInTier]);

  // ── Shopify wiring (pilot: only mapped SKUs hit Shopify) ───────────────
  const shopifyMapping = getShopifyMapping(product.slug);
  const { product: shopifyProduct, loading: shopifyLoading } = useShopifyProduct(
    shopifyMapping?.handle
  );
  const [selectedPack, setSelectedPack] = useState<string>(
    shopifyMapping?.defaultPackOption ?? "Single Can"
  );
  // PD gallery: index of the currently displayed Shopify image. Resets to 0
  // whenever the SKU changes so visiting a sibling product never starts on a
  // stale image. Only used when Shopify returns multiple images for a SKU;
  // otherwise the strip is hidden and the main image stays at index 0.
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  useEffect(() => {
    setSelectedImageIdx(0);
  }, [shopifyMapping?.handle]);
  const addItem = useCartStore((s) => s.addItem);
  const cartLoading = useCartStore((s) => s.isLoading);

  const packOptions =
    shopifyProduct?.node.options.find((o) => o.name === "Pack")?.values ?? [];

  // Per-pack savings map keyed by pack option name (e.g. "12 PACK"). For
  // each variant we extract a pack count from the variant's "Pack" option
  // value via /(\d+)/ — so any value that includes a parseable integer
  // works ("4 PACK", "12 PACK", "Case of 24", etc.). The variant with the
  // smallest pack count is the baseline; its per-unit price is the
  // comparison anchor. For every other variant, savings is the percentage
  // reduction in per-unit price vs the baseline, rounded to a whole
  // number for display ("Save 9%", not "Save 8.83%"). Per-unit price is
  // never shown to customers — it exists only as the comparison engine.
  //
  // Variants whose pack value lacks a parseable integer are skipped from
  // the calc (their pack button renders without a savings badge); the
  // map gracefully degrades to empty when there's only one variant or
  // no Shopify data. Negative or zero savings (a larger pack that costs
  // more per unit, or is priced identically) is also suppressed at
  // render time so we never display "Save 0%" or "Save -3%".
  const savingsByPack = useMemo(() => {
    const variants = shopifyProduct?.node.variants.edges ?? [];
    const rows = variants
      .map((e) => {
        const packOpt = e.node.selectedOptions.find((o) => o.name === "Pack");
        if (!packOpt) return null;
        const match = packOpt.value.match(/\d+/);
        if (!match) return null;
        const count = parseInt(match[0], 10);
        const price = parseFloat(e.node.price.amount);
        if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(price)) {
          return null;
        }
        return { packName: packOpt.value, count, price };
      })
      .filter((r): r is { packName: string; count: number; price: number } => r !== null);

    const map = new Map<string, { savingsPct: number; isBaseline: boolean }>();
    if (rows.length < 2) return map;

    const baseline = rows.reduce((min, r) => (r.count < min.count ? r : min), rows[0]);
    const baselineUnitPrice = baseline.price / baseline.count;
    for (const r of rows) {
      const isBaseline = r.count === baseline.count;
      const unitPrice = r.price / r.count;
      const savingsPct = isBaseline
        ? 0
        : Math.round((1 - unitPrice / baselineUnitPrice) * 100);
      map.set(r.packName, { savingsPct, isBaseline });
    }
    return map;
  }, [shopifyProduct]);

  // Effective selection — derived (not stored) so the initial render
  // already resolves to a real variant. The useState seed is
  // `defaultPackOption` from the slug map ("Single Can" for every SKU),
  // which is a historical placeholder that doesn't correspond to any
  // actual Shopify variant — so on first load `selectedPack` matches
  // nothing in `packOptions` and the row would render with no button
  // visually selected. Resolving through a memo instead of a useEffect
  // avoids the one-frame flash a post-commit effect would produce: the
  // very first render where Shopify data is in already picks the right
  // button.
  //
  // Priority: (1) if the user's stored selection matches a real variant,
  // honor it — this is the steady state after a click. (2) else fall
  // back to the smallest pack (the savings baseline). (3) else fall
  // back to whatever's first in packOptions, then the raw stored value
  // — these last two are safety nets for malformed variant data.
  const effectiveSelectedPack = useMemo(() => {
    if (packOptions.includes(selectedPack)) return selectedPack;
    for (const [name, info] of savingsByPack.entries()) {
      if (info.isBaseline) return name;
    }
    return packOptions[0] ?? selectedPack;
  }, [selectedPack, packOptions, savingsByPack]);

  const selectedVariant = shopifyProduct?.node.variants.edges.find((edge) =>
    edge.node.selectedOptions.some(
      (opt) => opt.name === "Pack" && opt.value === effectiveSelectedPack
    )
  )?.node ?? shopifyProduct?.node.variants.edges[0]?.node;

  const displayPrice = selectedVariant?.price.amount;
  const isInStock = selectedVariant?.availableForSale ?? false;

  const handleAddToCart = async () => {
    if (!shopifyProduct || !selectedVariant) return;
    await addItem({
      variantId: selectedVariant.id,
      productHandle: shopifyProduct.node.handle,
      productTitle: shopifyProduct.node.title,
      variantTitle: selectedVariant.title,
      imageUrl:
        shopifyProduct.node.images.edges[0]?.node.url ?? null,
      price: selectedVariant.price,
      quantity: qty,
      selectedOptions: selectedVariant.selectedOptions,
    });
  };

  // BreadcrumbList JSON-LD — mirrors the visible breadcrumb above exactly
  // (Home → Products → {tier}mg → {flavor}) so screen and schema agree.
  // `<` escaped so the JSON can't terminate the inline <script> early.
  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://savorsunrise.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://savorsunrise.com/products" },
      {
        "@type": "ListItem",
        position: 3,
        name: `${product.tier}mg`,
        item: `https://savorsunrise.com/products?tier=${product.tier}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.flavor,
        item: `https://savorsunrise.com/products/${product.slug}`,
      },
    ],
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }}
      />
      <SiteHeader activeNav="products" />

      <main style={{ ["--flavor-color" as string]: product.color } as React.CSSProperties}>
        {/* ── 01 · BREADCRUMB ───────────────────────────────────────────── */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <div className="container">
            <ol>
              <li><a href="/">Home</a></li>
              <li aria-hidden="true">·</li>
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
              <div className="pd-hero-gallery">
              <div className="pd-hero-can" style={{ background: product.color }}>
                {(() => {
                  // Priority: Shopify image (mapped SKUs) → local slug image →
                  // colored placeholder (only hit if the local file is missing).
                  // Every SKU has a companion /images/cans/{slug}.webp, so the
                  // placeholder branch is effectively unreachable in practice.
                  // When multiple Shopify images exist, the selected thumb (rendered below the
                  // can) drives which one shows here via selectedImageIdx; default index is 0.
                  const shopifyImages = shopifyProduct?.node.images.edges ?? [];
                  const shopifyImage =
                    shopifyImages[selectedImageIdx]?.node ?? shopifyImages[0]?.node;
                  if (shopifyImage?.url) {
                    return (
                      <img
                        src={shopifyImage.url}
                        alt={
                          shopifyImage.altText ??
                          `SUNRISE ${product.flavor} ${product.tier}mg THC hemp-infused seltzer can`
                        }
                      />
                    );
                  }
                  return (
                    <img
                      src={`/images/cans/${product.slug}.webp`}
                      alt={`SUNRISE ${product.flavor} ${product.tier}mg THC hemp-infused seltzer can`}
                    />
                  );
                })()}
              </div>
              {/* Thumbnail strip — only renders when Shopify returns 2+ images for the
                  SKU. The query in src/lib/shopify.ts already requests up to 5 images;
                  expanding the catalog later is purely a Shopify-side change. */}
              {(() => {
                const thumbs = shopifyProduct?.node.images.edges ?? [];
                if (thumbs.length < 2) return null;
                return (
                  <div className="pd-hero-thumbs" role="list">
                    {thumbs.map((edge, idx) => {
                      const isActive = idx === selectedImageIdx;
                      return (
                        <button
                          key={edge.node.url}
                          type="button"
                          role="listitem"
                          aria-label={`View image ${idx + 1} of ${thumbs.length}`}
                          aria-pressed={isActive}
                          className={
                            "pd-hero-thumb" + (isActive ? " is-active" : "")
                          }
                          style={{ background: product.color }}
                          onClick={() => setSelectedImageIdx(idx)}
                        >
                          <img
                            src={edge.node.url}
                            alt={edge.node.altText ?? `Thumbnail ${idx + 1}`}
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              </div>

              <div className="pd-hero-meta">
                {/* Hero meta column — flavor headline is the first element on
                    every SKU. The cannabinoid lockup that previously sat
                    above the headline on +CBG/+CBN/+THCV SKUs was removed:
                    cannabinoid identity is communicated downstream via S02
                    (which renders the +30 MG / cannabinoid potency lockup
                    plus the icon and "Best for X" copy), so duplicating it
                    above the flavor name added visual noise without new
                    information. Non-cannabinoid and cannabinoid SKUs now
                    render an identical hero meta column structure.         */}
                <h1 className="pd-hero-flavor">{product.flavor}</h1>

                <div className="pd-hero-descriptor">{product.descriptor}</div>

                {(() => {
                  const html = shopifyProduct?.node.descriptionHtml?.trim();
                  if (!html) {
                    return <p className="pd-hero-blurb">{product.blurb}</p>;
                  }
                  const firstClose = html.indexOf("</p>");
                  const head =
                    firstClose >= 0 ? html.slice(0, firstClose + 4) : html;
                  const rest =
                    firstClose >= 0 ? html.slice(firstClose + 4).trim() : "";
                  return (
                    <div className="pd-hero-blurb">
                      <div dangerouslySetInnerHTML={{ __html: head }} />
                      {rest && (
                        <>
                          {blurbExpanded && (
                            <div
                              className="pd-hero-blurb-rest"
                              dangerouslySetInnerHTML={{ __html: rest }}
                            />
                          )}
                          <button
                            type="button"
                            className="pd-hero-blurb-toggle"
                            onClick={() => setBlurbExpanded((v) => !v)}
                            aria-expanded={blurbExpanded}
                          >
                            {blurbExpanded ? "Read less" : "Read more"}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}

                <div className="pd-hero-price">
                  {shopifyMapping ? (
                    shopifyLoading ? (
                      <span className="pd-price-amount">…</span>
                    ) : displayPrice ? (
                      <span className="pd-price-amount">
                        ${parseFloat(displayPrice).toFixed(2)}
                      </span>
                    ) : (
                      <span className="pd-price-amount">Coming soon</span>
                    )
                  ) : (
                    <span className="pd-price-amount">$X.XX</span>
                  )}
                </div>

                {shopifyMapping && packOptions.length > 1 && (
                  <div className="pd-hero-pack" role="radiogroup" aria-label="Pack size">
                    {packOptions.map((opt) => {
                      const info = savingsByPack.get(opt);
                      const showSavings =
                        info != null && !info.isBaseline && info.savingsPct > 0;
                      const isSelected = effectiveSelectedPack === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={`pd-pack-btn${isSelected ? " is-selected" : ""}`}
                          style={{ ["--flavor-color" as string]: product.color } as React.CSSProperties}
                          onClick={() => setSelectedPack(opt)}
                        >
                          <span className="pd-pack-btn-name">{opt}</span>
                          {showSavings && (
                            <span className="pd-pack-btn-savings">
                              Save {info.savingsPct}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

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
                  {shopifyMapping ? (
                    <button
                      type="button"
                      className="btn btn-flavor"
                      style={{ ["--flavor-color" as string]: product.color } as React.CSSProperties}
                      onClick={handleAddToCart}
                      disabled={
                        shopifyLoading ||
                        cartLoading ||
                        !selectedVariant ||
                        !isInStock
                      }
                    >
                      {cartLoading
                        ? "Adding…"
                        : !isInStock && !shopifyLoading
                        ? "Sold Out"
                        : "Add to Your Cart"}
                    </button>
                  ) : (
                    <a
                      href="#"
                      className="btn btn-flavor"
                      style={{ ["--flavor-color" as string]: product.color } as React.CSSProperties}
                    >
                      Add to Your Cart
                    </a>
                  )}
                  <a href="/find" className="btn btn-secondary">Find Near You</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · CANNABINOID STORY (variant only) ─────────────────────── */}
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
                {/* Element 1 — icon. Inline-SVG component so the circle's
                    fill can be set dynamically to product.color (matching
                    the section's flood); the cream glyph is what reads
                    visibly against the flood. Sized via .pd-cannabinoid-icon
                    in CSS at base * 4.8 so it serves as the section's
                    primary visual anchor. */}
                <CannabinoidIcon
                  cannabinoid={product.cannabinoid}
                  bgColor={product.color}
                  className="pd-cannabinoid-icon"
                />
                {/* Element 2 — full +30 MG / cannabinoid potency lockup in
                    cream. Painted in useEffect via cannabinoidLockupRef. */}
                <div
                  className="pd-cannabinoid-lockup"
                  ref={cannabinoidLockupRef}
                  aria-label={`+30 mg ${product.cannabinoid}`}
                />
                {/* Element 3 — copy block. "Best for X" subhead + three
                    body lines describing the cannabinoid's effect profile. */}
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

        {/* ── 04 · STAT STRIP ───────────────────────────────────────────── */}
        {/* Flavor-color band carrying the 12oz lockup plus three claim     */}
        {/* badges. Each claim renders icon-left / wordmark-right, both     */}
        {/* sourced from the same canonical claim SVG via viewBox crops —   */}
        {/* the icon-half from the cls-2 graphic and the wordmark-half      */}
        {/* from the cls-1 text, recolored to cream against the flavor      */}
        {/* flood. Background flood, no top/bottom borders — the color     */}
        {/* block defines the section break.                                 */}
        <section className="pd-stats">
          <div className="container">
            <div className="pd-stats-grid">
              <div className="pd-stat">
                <div className="pd-stat-lockup" ref={stat12Ref} aria-hidden="true" />
              </div>
              <div className="pd-claim" role="img" aria-label="Gluten Free">
                <span
                  className="pd-claim-icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: glutenFreeIcon }}
                />
                <span
                  className="pd-claim-text"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: glutenFreeText }}
                />
              </div>
              <div className="pd-claim" role="img" aria-label="Natural Vegan">
                <span
                  className="pd-claim-icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: naturalVeganIcon }}
                />
                <span
                  className="pd-claim-text"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: naturalVeganText }}
                />
              </div>
              <div className="pd-claim" role="img" aria-label="Zero Alcohol">
                <span
                  className="pd-claim-icon"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: zeroAlcoholIcon }}
                />
                <span
                  className="pd-claim-text"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: zeroAlcoholText }}
                />
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
              {othersInTier.map((o, i) => (
                <Link
                  key={o.slug}
                  to="/products/$slug"
                  params={{ slug: o.slug }}
                  className="pd-related-card"
                  style={{ ["--pd-related-color" as string]: o.color } as React.CSSProperties}
                >
                  <RelatedCan slug={o.slug} flavorName={o.flavor} color={o.color}>
                    {o.cannabinoid && (
                      <span
                        className="pd-related-corner"
                        ref={(el) => { relatedCornerRefs.current[i] = el; }}
                        aria-label={`+${o.cannabinoid}`}
                      />
                    )}
                  </RelatedCan>
                  <div className="pd-related-meta">
                    <div className="pd-related-name">{o.flavor}</div>
                    <div className="pd-related-descriptor">{o.descriptor}</div>
                  </div>
                  <div className="pd-related-cta">
                    <span className="pd-related-cta-label">Buy Now</span>
                    <span className="pd-related-cta-arrow">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── 06 · WHAT'S INSIDE ────────────────────────────────────────── */}
        {/* Verbatim replica of home S05 — same markup, same copy. Center    */}
        {/* image is the current SKU's can mockup, sourced via product.slug  */}
        {/* (slugs map 1:1 to filenames in /images/cans/). Class prefix      */}
        {/* stays pd-inside-* for route-scoped styling; the rules in         */}
        {/* products_.$slug.css mirror home's current .s04-* values          */}
        {/* one-for-one.                                                     */}
        <section className="pd-ingredients">
          <div className="container">
            <h2 className="pd-inside-headline">
              What's Inside<br />
              <span className="accent">Each can?</span>
            </h2>
            <div className="pd-inside-trifecta">
              <div className="pd-inside-col pd-inside-col-left">
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Purified<br />Water</div>
                  <div className="pd-inside-ing-desc">
                    Reverse-osmosis filtered water carefully chosen for exceptional
                    hydration &amp; uncompromising flavor.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Pure Cane<br />Sugar</div>
                  <div className="pd-inside-ing-desc">
                    A touch of real sugar for smooth, naturally derived sweetness.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Natural<br />Flavoring</div>
                  <div className="pd-inside-ing-desc">
                    Sourced from real fruits and botanicals, our flavors deliver
                    bright, authentic notes true to their names.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Fresh Lemon<br />Juice</div>
                  <div className="pd-inside-ing-desc">
                    Used exclusively in our Lemonade flavors, this ingredient brings
                    a hint of crisp acidity with a natural citrus lift.
                  </div>
                </div>
              </div>
              <div className="pd-inside-center">
                <img
                  className="pd-inside-can"
                  src={`/images/cans/${product.slug}.webp`}
                  alt={`SUNRISE ${product.tier}mg THC ${product.flavor} hemp-infused seltzer can`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="pd-inside-col pd-inside-col-right">
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Emulsified<br />Hemp Extract</div>
                  <div className="pd-inside-ing-desc">
                    The good stuff — expertly blended cannabis extract for a clean
                    and consistent experience with every sip.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Naturally Sourced<br />Enhancers</div>
                  <div className="pd-inside-ing-desc">
                    Functional ingredients like B12 that allow for a healthier,
                    more balanced experience without altering flavors.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Citric<br />Acid</div>
                  <div className="pd-inside-ing-desc">
                    A naturally occurring acid found in citrus fruits, this is used
                    to balance flavors and keep things bubbly.
                  </div>
                </div>
                <div className="pd-inside-ing">
                  <div className="pd-inside-ing-name">Sodium<br />Benzoate</div>
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
              <h2 className="pd-section-headline">
                What are people <span className="accent">asking?</span>
              </h2>
            </div>
            <div className="pd-faq-list">
              {getFaqsForProduct(product).map((item, idx) => (
                <details key={idx} className="pd-faq-item">
                  <summary className="pd-faq-q">
                    <span>{item.q}</span>
                    <span className="pd-faq-chev" aria-hidden="true">+</span>
                  </summary>
                  <div className="pd-faq-a">{item.a}</div>
                </details>
              ))}
            </div>
            <div className="pd-faq-more">
              <a href="/faq" className="pd-faq-more-link">
                See the full FAQ <span aria-hidden="true">→</span>
              </a>
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
                  <span className="pd-ptp-line-1">Now you know</span><br />
                  <span className="pd-ptp-line-2">{product.flavor}</span>
                </h2>
                <p className="pd-ptp-body">
                  Find one near you or explore other flavors and potencies.
                </p>
              </div>
              <div className="pd-ptp-ctas">
                <a href="#" className="btn btn-on-color">Shop the Lineup</a>
                <a href="/find" className="btn btn-on-color-ghost">Find Near You</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

// ── RelatedCan ───────────────────────────────────────────────────────────
// Renders the can thumbnail for each "Others in Tier" sibling card. Mirrors
// the FlavorCan helper on /products: prefers a live Shopify image for
// mapped SKUs, falls back to the local /images/cans/{slug}.webp asset that
// every SKU ships with. The colored placeholder branch is effectively
// unreachable in practice. The `color` prop floods the frame in the
// sibling SKU's flavor color so each card carries its own identity.
// `children` lets the caller slot overlays (e.g. the cannabinoid corner
// lockup) into the can-frame box so absolute-positioned siblings are
// scoped to the flavor-flooded area rather than the whole card height.
function RelatedCan({ slug, flavorName, color, children }: { slug: string; flavorName: string; color: string; children?: React.ReactNode }) {
  const mapping = getShopifyMapping(slug);
  const { product } = useShopifyProduct(mapping?.handle);
  const image = product?.node.images.edges[0]?.node;

  if (image?.url) {
    return (
      <div className="pd-related-can has-image" style={{ background: color }}>
        <img
          src={image.url}
          alt={image.altText ?? `SUNRISE ${flavorName} can`}
          loading="lazy"
        />
        {children}
      </div>
    );
  }
  return (
    <div className="pd-related-can has-image" style={{ background: color }}>
      <img
        src={`/images/cans/${slug}.webp`}
        alt={`SUNRISE ${flavorName} can`}
        loading="lazy"
      />
      {children}
    </div>
  );
}
