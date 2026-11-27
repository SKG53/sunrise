// BLACK FRIDAY MEGA SALE (Nov 27 2026): a FREE 4-pack for every $100 of
// 30mg + 60mg in the cart, after the 30% comes off. No code: the gifts are a
// real $0.00 Shopify product ("FREE 4-Pack", handle free-4-pack, 12 flavor
// variants) that the cart adds and removes by itself (stores/cartStore.ts,
// reconcile step 2b).
//
// Rule (founder brief, Nov 27):
//   qualifying spend = Shopify's own line totals after discounts, in integer
//                      cents, for lines whose handle starts 30mg- or 60mg-
//                      (gift lines, other tiers, shipping and tax excluded)
//   gifts earned     = floor(spend / $100), no cap
// Switch: MEGA_SALE_ENABLED in lib/sale.ts. Manual only; nothing reads the
// clock (founder, Nov 19). Off = no messaging, and gift lines in any cart are
// removed with a notice.
//
// The site is not the only way into a Shopify cart: the free variants are on
// the same sales channel as the site, so fulfillment re-checks every order
// with a FREE 4-Pack against its own paid lines (validation v1, §3.1).

import { MEGA_SALE_ENABLED } from "./sale";

export const MEGA_GIFT_PRODUCT_HANDLE = "free-4-pack";
export const MEGA_STEP_CENTS = 10000;
export const GIFT_ATTR = "_sr_gift";
export const GIFT_VALUE = "BFMEGA";
export const GIFT_SLOT_ATTR = "_sr_gift_slot";

export type MegaGift = {
  /** Paid product handle (Shopify) this gift matches. */
  handle: string;
  /** Site slug for that flavor (PDP, can images, lib/liveFourPacks). The
   *  cannabinoid flavors differ: Shopify 60mg-blackberry = site 60mg-blackberry-cbn. */
  slug: string;
  /** Free variant title, as Shopify checkout shows it. */
  label: string;
  tier: 30 | 60;
  variantId: string;
};

const V = (id: string) => `gid://shopify/ProductVariant/${id}`;

// Verified in Shopify Admin Nov 27 2026 (product 15598205927636, ACTIVE,
// Lovable channel only, all $0.00, compareAt $28.95 / $24.95). Picker order.
export const MEGA_GIFT_VARIANTS: MegaGift[] = [
  { handle: "60mg-blueberry-lemonade", slug: "60mg-blueberry-lemonade", label: "60MG Blueberry Lemonade", tier: 60, variantId: V("68600735367380") },
  { handle: "60mg-passionfruit-mango", slug: "60mg-passionfruit-mango", label: "60MG Passionfruit Mango", tier: 60, variantId: V("68600735400148") },
  { handle: "60mg-wild-cherry-peach", slug: "60mg-wild-cherry-peach", label: "60MG Wild Cherry Peach", tier: 60, variantId: V("68600735432916") },
  { handle: "60mg-blood-orange", slug: "60mg-blood-orange-cbg", label: "60MG + CBG Blood Orange", tier: 60, variantId: V("68600735465684") },
  { handle: "60mg-blackberry", slug: "60mg-blackberry-cbn", label: "60MG + CBN Blackberry", tier: 60, variantId: V("68600735498452") },
  { handle: "60mg-strawberry-kiwi", slug: "60mg-strawberry-kiwi-thcv", label: "60MG + THCV Strawberry Kiwi", tier: 60, variantId: V("68600735531220") },
  { handle: "30mg-cherry-limeade", slug: "30mg-cherry-limeade", label: "30MG Cherry Limeade", tier: 30, variantId: V("68600735563988") },
  { handle: "30mg-orange-lemonade", slug: "30mg-orange-lemonade", label: "30MG Orange Lemonade", tier: 30, variantId: V("68600735596756") },
  { handle: "30mg-peach-mango", slug: "30mg-peach-mango", label: "30MG Peach Mango", tier: 30, variantId: V("68600735629524") },
  { handle: "30mg-kiwi-watermelon", slug: "30mg-kiwi-watermelon-cbg", label: "30MG + CBG Kiwi Watermelon", tier: 30, variantId: V("68600735662292") },
  { handle: "30mg-blueberry-pomegranate", slug: "30mg-blueberry-pomegranate-cbn", label: "30MG + CBN Blueberry Pomegranate", tier: 30, variantId: V("68600735695060") },
  { handle: "30mg-strawberry-watermelon", slug: "30mg-strawberry-watermelon-thcv", label: "30MG + THCV Strawberry Watermelon", tier: 30, variantId: V("68600735727828") },
];
/** List price of the 4-pack a gift stands for (shown struck through if
 *  Shopify's compareAtPrice is missing). */
export const MEGA_GIFT_LIST: Record<30 | 60, number> = { 30: 24.95, 60: 28.95 };

const BY_VARIANT = new Map(MEGA_GIFT_VARIANTS.map((g) => [g.variantId, g]));
const BY_HANDLE = new Map(MEGA_GIFT_VARIANTS.map((g) => [g.handle, g]));

export const giftByVariant = (variantId: string) => BY_VARIANT.get(variantId) ?? null;
export const giftByHandle = (handle: string) => BY_HANDLE.get(handle) ?? null;

/** Anything shaped like a cart line (store item or Shopify line view). */
export type MegaLine = {
  variantId: string;
  productHandle: string;
  variantTitle: string;
  quantity: number;
  lineTotal?: number;
  price?: { amount: string };
};

/** A gift line: one of the 12 free variants, with or without our attributes. */
export const isGiftLine = (l: Pick<MegaLine, "variantId" | "productHandle">) =>
  BY_VARIANT.has(l.variantId) || l.productHandle === MEGA_GIFT_PRODUCT_HANDLE;

const QUALIFYING_RE = /^(30|60)mg-/;
export const isQualifyingLine = (l: MegaLine) => !isGiftLine(l) && QUALIFYING_RE.test(l.productHandle);

const lineCents = (l: MegaLine) =>
  Math.round((l.lineTotal ?? Number(l.price?.amount ?? 0) * l.quantity) * 100);

/** Qualifying spend in integer cents (Shopify's line totals after discounts). */
export function qualifyingCents(lines: MegaLine[]): number {
  return lines.reduce((s, l) => (isQualifyingLine(l) ? s + lineCents(l) : s), 0);
}

/** Free 4-packs this cart earns now (0 while the Mega Sale is off). */
export function earnedGifts(lines: MegaLine[]): number {
  if (!MEGA_SALE_ENABLED) return 0;
  return Math.floor(qualifyingCents(lines) / MEGA_STEP_CENTS);
}

/** Cans in a line: SINGLE CAN = 1, "N PACK" = N (4/12/20/40/60/80). */
export function cansPerUnit(variantTitle: string): number {
  const t = variantTitle.toLowerCase();
  if (/single/.test(t)) return 1;
  const m = /(\d+)\s*-?\s*pack/.exec(t);
  return m ? Number(m[1]) : 1;
}

/** The paid 30/60mg flavor with the most cans in the cart; ties go to the
 *  flavor added to the cart first. Shopify lists the NEWEST line first
 *  (verified live Nov 27), so lines are read oldest-first. Null when no
 *  qualifying line maps to a gift. */
export function topFlavor(lines: MegaLine[]): MegaGift | null {
  const cans = new Map<string, number>();
  for (const l of [...lines].reverse()) {
    if (!isQualifyingLine(l) || !BY_HANDLE.has(l.productHandle)) continue;
    cans.set(l.productHandle, (cans.get(l.productHandle) ?? 0) + l.quantity * cansPerUnit(l.variantTitle));
  }
  let best: string | null = null;
  let most = 0;
  cans.forEach((n, h) => {
    if (n > most) {
      best = h;
      most = n;
    }
  });
  return best ? (BY_HANDLE.get(best) ?? null) : null;
}

/** Default flavor for a NEW gift (existing gifts are never re-flavored). */
export function defaultGift(lines: MegaLine[]): MegaGift {
  return topFlavor(lines) ?? MEGA_GIFT_VARIANTS[0];
}

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
/** "$100", "$200": whole-dollar steps for notices. */
export const stepLabel = (n: number) => `$${(n * MEGA_STEP_CENTS) / 100}`;

// Copy (founder brief, Nov 27; block + bar re-worded to match the GM6 email
// v3, founder Nov 27). "OFF" in caps; no dates beyond Monday Nov 30.
export const MEGA_COPY = {
  bar: "BLACK FRIDAY MEGA SALE · 30% OFF + FREE 4-PACKS WITH EVERY $100 · Ends Monday 11:59 PM CT",
  // Home + /products block, top to bottom (same lines as the email hero).
  title: "BLACK FRIDAY",
  kicker: "MEGA SALE",
  big: ["30% OFF +", "FREE 4-PACKS"], // two lines, as in the email
  every: "WITH EVERY $100",
  pill: "OUR BEST PRICES EVER + FREE GIFTS",
  howTitle: "HOW IT WORKS",
  steps: [
    { title: "SHOP YOUR FAVORITES.", sub: "30% OFF applies automatically." },
    { title: "EVERY $100 IN YOUR CART ADDS A FREE 4-PACK.", sub: "$200 = 2. $300 = 3. No limit." },
    { title: "PICK YOUR FREE 4-PACK.", sub: "Any flavor, any strength." },
  ],
  pdp: "FREE 4-pack with every $100 (after 30% OFF). No code needed.",
  ended: "The Black Friday Mega Sale has ended, so we took out your free 4-pack.",
  failed: "We couldn't add your free 4-pack right now. Please refresh, or reach out and we'll make it right.",
  dropped: (n: number) => `Your cart dropped below ${stepLabel(n)}, so we took out a free 4-pack.`,
  toast: (flavor: string) => `🎁 FREE 4-pack added! We picked ${flavor}. Tap Change flavor to switch.`,
  nudge: "Add 1 more 4-pack → FREE 4-pack unlocked",
};
