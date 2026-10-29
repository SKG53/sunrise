// DEALS SETTINGS — the one file to edit when a deal changes.
//
// Every code the site may auto-apply lives here, with a plain-language rule
// that MIRRORS the Shopify discount (pulled from Shopify Admin Oct 28 2026,
// product lists re-verified with full pagination). Shopify is still the
// judge: the cart always shows Shopify's real discount. These rules drive the
// progress meter ("add 1 more 4-pack…"), the free-item handling for
// buy-X-get-Y codes, the cart button rule, the /products banner and which
// landing page a code opens (Spin & Save "Shop Now").
//
// If you change a discount in Shopify, change its row here the same day.
// A code that is NOT listed here is never auto-applied from a link.
//
// Shopify facts that shape this file:
//   - No code combines with any other (combinesWith all false), so the cart
//     carries ONE code at a time (lib/dealWallet.ts).
//   - Buy-X-get-Y codes fail silently unless the "get" item is in the cart,
//     so the cart adds it (hidden line attribute `_sr_free`). Shopify frees
//     the CHEAPEST qualifying unit in the whole cart, whatever we mark.
//   - Once-per-customer codes: as soon as the cart carries the shopper's
//     email, Shopify reports a code that email already used (warning
//     DISCOUNT_CUSTOMER_USAGE_LIMIT_REACHED, applicable:false), even before
//     the cart qualifies. Verified live Oct 29 (anonymous carts, no orders).

export const FREE_SHIP_THRESHOLD = 74.5; // live Shopify rate threshold, after discounts (verified)
export const FREE_SHIP_LABEL = 75; // what copy says (house rule)

export type Tier = 5 | 10 | 30 | 60;
export type PackKind = "single" | "4" | "12" | "20";
export type Scope = { packs: PackKind[]; tiers: Tier[] };

type Base = {
  code: string;
  /** The deal in shopper words, e.g. "Buy 4, get 1 free". Leads every surface; the code is secondary. */
  label: string;
  /** /products banner line for this code. */
  banner: string;
  /** Landing page for this code (Build Your Box), if any. */
  boxPath?: string;
};
export type DealRule =
  | (Base & { kind: "percent"; percent: number; scope: Scope; minQty?: number })
  | (Base & { kind: "bxgy"; buy: number; buyScope: Scope; get: number; getScope: Scope })
  | (Base & { kind: "freeCan"; amountOff: number; scope: Scope });

const FOUR_ALL: Scope = { packs: ["4"], tiers: [10, 30, 60] };
const FOUR_10: Scope = { packs: ["4"], tiers: [10] };
const FOUR_EVERY: Scope = { packs: ["4"], tiers: [5, 10, 30, 60] };
const PACKS_ALL: Scope = { packs: ["4", "12", "20"], tiers: [5, 10, 30, 60] };
const CANS_AND_PACKS_ALL: Scope = { packs: ["single", "4", "12", "20"], tiers: [5, 10, 30, 60] };
const SINGLE_ANY: Scope = { packs: ["single"], tiers: [5, 10, 30, 60] };

const pct = (
  code: string,
  percent: number,
  scope: Scope,
  label: string,
  banner: string,
  minQty?: number,
  boxPath?: string,
): DealRule => ({ kind: "percent", code, percent, scope, minQty, label, banner, boxPath });
const bxgy = (code: string, buy: number, get: number, getScope: Scope, label: string, boxPath?: string): DealRule => ({
  kind: "bxgy",
  code,
  buy,
  buyScope: FOUR_ALL,
  get,
  getScope,
  label,
  banner: `Your deal: ${label}.`,
  boxPath,
});
const freeCan = (code: string): DealRule => ({
  kind: "freeCan",
  code,
  amountOff: 7.95,
  scope: SINGLE_ANY,
  label: "A free single can",
  banner: "Your free can: add any single can and it's on us. You just cover shipping.",
});

const PCT_PACKS = (p: number) => `Your ${p}% off applies automatically to 4, 12 and 20 packs.`;
const PCT_CANS_PACKS = (p: number) => `Your ${p}% off applies automatically to single cans and 4, 12 and 20 packs.`;
const PCT_MIN = (p: number, n: number) => `Your deal: ${p}% off when you get ${n} or more 4-packs.`;

export const DEALS: DealRule[] = [
  // Spin & Save wheel (wheel_v2)
  bxgy("NEWCUST4P1FR", 4, 1, FOUR_ALL, "Buy 4, get 1 free", "/box/buy4get1"),
  bxgy("NEWCUST2P10MG", 2, 1, FOUR_10, "Buy 2, get a 10mg 4-pack free", "/box/buy2get10mg"),
  pct("NEWCUST2P25", 25, FOUR_ALL, "25% off 2 or more 4-packs", PCT_MIN(25, 2), 2, "/box/25off2"),
  pct("NEWCUST5P25", 25, FOUR_ALL, "25% off 5 or more 4-packs", PCT_MIN(25, 5), 5, "/box/25off5"),
  pct("NEWCUST5P30", 30, FOUR_ALL, "30% off 5 or more 4-packs", PCT_MIN(30, 5), 5, "/box/30off5"),
  pct("SRSPINWIN15OFF", 15, PACKS_ALL, "15% off 4, 12 and 20 packs", PCT_PACKS(15)),
  pct("SRSPINWIN20OFF", 20, PACKS_ALL, "20% off 4, 12 and 20 packs", PCT_PACKS(20)),
  // Deal-specific Meta ads (AD_DEALS in SpinWheel) + Meta test codes
  bxgy("FREE4PACK", 2, 1, FOUR_ALL, "Buy 2, get 1 free", "/box/buy2get1"),
  bxgy("NCB2G1FMT", 2, 1, FOUR_ALL, "Buy 2, get 1 free"),
  pct("25OFF5", 25, FOUR_ALL, "25% off 5 or more 4-packs", PCT_MIN(25, 5), 5),
  pct("NC5P25MT", 25, FOUR_ALL, "25% off 5 or more 4-packs", PCT_MIN(25, 5), 5),
  // Free can (home section, landing pages, email)
  freeCan("WEBFREECAN"),
  freeCan("TRYFREECAN"),
  freeCan("FREECAN"),
  // Email / flow codes
  pct("SAVOR20", 20, CANS_AND_PACKS_ALL, "20% off cans and packs", PCT_CANS_PACKS(20)),
  pct("SUNRISE20", 20, CANS_AND_PACKS_ALL, "20% off cans and packs", PCT_CANS_PACKS(20)),
  pct("SUNRISESAVE20", 20, CANS_AND_PACKS_ALL, "20% off cans and packs", PCT_CANS_PACKS(20)),
  pct("20OFFRESTOCK", 20, CANS_AND_PACKS_ALL, "20% off cans and packs", PCT_CANS_PACKS(20)),
  pct("25OFF5RESTOCK", 25, FOUR_EVERY, "25% off 5 or more 4-packs", PCT_MIN(25, 5), 5),
  pct("15OFFREVIEW", 15, CANS_AND_PACKS_ALL, "15% off cans and packs", PCT_CANS_PACKS(15)),
];

export function dealByCode(code: string | null | undefined): DealRule | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  return DEALS.find((d) => d.code.toUpperCase() === c) ?? null;
}

// ── CART LINE CLASSIFICATION ─────────────────────────────────────────────
export type DealLine = {
  id: string;
  variantId: string;
  handle: string; // Shopify product handle, e.g. "60mg-blackberry"
  variantTitle: string; // "4 PACK" / "SINGLE CAN" / "12 PACK" / "20 PACK"
  quantity: number;
  unitPrice: number;
  /** Code this line was auto-added for (line attribute `_sr_free`), else null. */
  freeFor: string | null;
};

export function packOf(variantTitle: string): PackKind | null {
  const t = variantTitle.toLowerCase();
  if (/single/.test(t)) return "single";
  const m = /(\d+)\s*-?\s*pack/.exec(t);
  if (!m) return null;
  return m[1] === "4" || m[1] === "12" || m[1] === "20" ? (m[1] as PackKind) : null;
}
export function tierOf(handle: string): Tier | null {
  const m = /^(\d+)mg-/.exec(handle);
  const n = m ? Number(m[1]) : NaN;
  return n === 5 || n === 10 || n === 30 || n === 60 ? (n as Tier) : null;
}
export function inScope(line: Pick<DealLine, "handle" | "variantTitle">, scope: Scope): boolean {
  const p = packOf(line.variantTitle);
  const t = tierOf(line.handle);
  return !!p && !!t && scope.packs.includes(p) && scope.tiers.includes(t);
}
const count = (lines: DealLine[], scope: Scope, skip?: (l: DealLine) => boolean) =>
  lines.reduce((n, l) => (inScope(l, scope) && !skip?.(l) ? n + l.quantity : n), 0);

const isOurs = (l: DealLine, code: string) => l.freeFor?.toUpperCase() === code.toUpperCase();

/** Cheapest unit price among PAID (not auto-added) lines in a scope; Infinity if none. */
export function cheapestPaidPrice(lines: DealLine[], scope: Scope): number {
  return lines.reduce((m, l) => (!l.freeFor && inScope(l, scope) ? Math.min(m, l.unitPrice) : m), Infinity);
}
/** The cheapest paid line in a scope (the one Shopify frees). */
export function cheapestPaidLine(lines: DealLine[], scope: Scope): DealLine | null {
  return lines
    .filter((l) => !l.freeFor && inScope(l, scope))
    .sort((a, b) => a.unitPrice - b.unitPrice)[0] ?? null;
}

// ── EVALUATION ───────────────────────────────────────────────────────────
export type DealStatus = "none" | "progress" | "complete" | "na";
export type DealEval = {
  status: DealStatus;
  /** Units counted toward the requirement, and units required. */
  have: number;
  need: number;
  /** One line for the meter, e.g. "Add 2 more 4-packs to get 1 free". */
  message: string;
  /** true only when a deal is genuinely mid-way and should hold "Checkout" back
   *  as the secondary button. A free can never blocks (it's a separate offer). */
  blocking: boolean;
  /** bxgy: the cart should add the free item now. */
  addFree: boolean;
  /** bxgy: the auto-added free line should go, and why. */
  removeFreeLineId: string | null;
  removeReason: "below" | "paid-covers" | null;
  /** bxgy: paid lines meet the "buy" side, so the free pack can be (re)offered. */
  qualifies: boolean;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function evaluateDeal(rule: DealRule | null, lines: DealLine[], declinedFree = false): DealEval {
  const none: DealEval = {
    status: "none",
    have: 0,
    need: 0,
    message: "",
    blocking: false,
    addFree: false,
    removeFreeLineId: null,
    removeReason: null,
    qualifies: false,
  };
  if (!rule) return none;

  if (rule.kind === "percent") {
    const have = count(lines, rule.scope);
    const need = rule.minQty ?? 1;
    if (!rule.minQty) {
      return have > 0
        ? { ...none, status: "complete", have, need, message: `${rule.percent}% off unlocked ✓` }
        : { ...none, status: "na", have, need, message: `${rule.label}. Nothing in your cart qualifies yet.` };
    }
    if (have >= need) return { ...none, status: "complete", have, need, message: `${rule.percent}% off unlocked ✓` };
    const left = need - have;
    return {
      ...none,
      status: "progress",
      blocking: true,
      have,
      need,
      message: `Add ${plural(left, "more 4-pack", "more 4-packs")} to unlock ${rule.percent}% off`,
    };
  }

  if (rule.kind === "freeCan") {
    const have = count(lines, rule.scope);
    return have > 0
      ? { ...none, status: "complete", have: 1, need: 1, message: "Free can unlocked ✓" }
      : { ...none, status: "progress", blocking: false, have: 0, need: 1, message: "Add any single can. It's on us." };
  }

  // bxgy
  const ours = lines.find((l) => isOurs(l, rule.code)) ?? null;
  const paid = count(lines, rule.buyScope, (l) => !!l.freeFor);
  const paidGet = count(lines, rule.getScope, (l) => !!l.freeFor);
  const need = rule.buy + rule.get;
  const freeWord = rule.getScope.tiers.length === 1 && rule.getScope.tiers[0] === 10 ? "10mg 4-pack" : "4-pack";
  // Paid lines alone already satisfy buy + get: our extra pack would be charged.
  if (ours && paid >= need && paidGet >= rule.get) {
    return {
      ...none,
      status: "complete",
      have: need,
      need,
      qualifies: true,
      message: `Free ${freeWord} unlocked ✓`,
      removeFreeLineId: ours.id,
      removeReason: "paid-covers",
    };
  }
  if (ours && paid < rule.buy) {
    return {
      ...none,
      status: "progress",
      blocking: true,
      have: paid,
      need,
      message: `Add ${plural(rule.buy - paid, "more 4-pack", "more 4-packs")} to get your free ${freeWord}`,
      removeFreeLineId: ours.id,
      removeReason: "below",
    };
  }
  const total = count(lines, rule.buyScope);
  const getHave = count(lines, rule.getScope);
  if (total >= need && getHave >= rule.get) {
    return { ...none, status: "complete", have: need, need, qualifies: true, message: `Free ${freeWord} unlocked ✓` };
  }
  if (paid >= rule.buy) {
    return {
      ...none,
      status: "progress",
      blocking: true,
      have: paid,
      need,
      qualifies: true,
      message: declinedFree ? `Your free ${freeWord} is waiting. Add it below.` : `Adding your free ${freeWord}…`,
      addFree: !declinedFree,
    };
  }
  return {
    ...none,
    status: "progress",
    blocking: true,
    have: paid,
    need,
    message: `Add ${plural(rule.buy - paid, "more 4-pack", "more 4-packs")} to get a free ${freeWord}`,
  };
}

/** Would setting this line to `newQty` drop a bxgy deal below its "buy" side
 *  while our free pack is in the cart? (The drawer asks before doing it.) */
export function wouldLoseFree(rule: DealRule | null, lines: DealLine[], lineId: string, newQty: number): boolean {
  if (!rule || rule.kind !== "bxgy") return false;
  const ours = lines.find((l) => isOurs(l, rule.code));
  if (!ours) return false;
  const target = lines.find((l) => l.id === lineId);
  if (!target || target.freeFor || !inScope(target, rule.buyScope)) return false;
  const paid = count(lines, rule.buyScope, (l) => !!l.freeFor);
  return paid - (target.quantity - Math.max(0, newQty)) < rule.buy;
}

// ── FREE-SHIPPING METER ──────────────────────────────────────────────────
export function freeShipState(merchandiseAfterDiscounts: number) {
  const unlocked = merchandiseAfterDiscounts >= FREE_SHIP_THRESHOLD;
  const fill = Math.max(0, Math.min(merchandiseAfterDiscounts / FREE_SHIP_THRESHOLD, 1));
  // Copy says $75 (house rule), so "away" is measured from the label, never
  // below $0.01 while still locked.
  const away = unlocked ? 0 : Math.max(0.01, Math.round((FREE_SHIP_LABEL - merchandiseAfterDiscounts) * 100) / 100);
  return { unlocked, fill, away };
}
