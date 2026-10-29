// DEALS SETTINGS — the one file to edit when a deal changes.
//
// Every code the site may auto-apply lives here, with a plain-language rule
// that MIRRORS the Shopify discount (pulled from Shopify Admin Oct 28 2026).
// Shopify is still the judge: the cart always shows Shopify's real discount.
// These rules only drive the progress meter ("add 1 more 4-pack…"), the
// free-item auto-add for buy-X-get-Y codes, and the cart button rule.
//
// If you change a discount in Shopify, change its row here the same day.
// A code that is NOT listed here is never auto-applied from a link.
//
// Shopify facts that shape this file:
//   - No code combines with any other (combinesWith all false), so the cart
//     carries ONE code at a time: the shopper's most recently claimed one,
//     switchable in the cart (lib/dealWallet.ts).
//   - Buy-X-get-Y codes fail silently unless the "get" item is in the cart,
//     so the cart adds it (marked with the hidden line attribute `_sr_free`).
//   - Product lists re-verified Oct 28 with full pagination: SRSPINWIN15OFF/
//     20OFF cover 4/12/20 packs of every tier (5/10/30/60); SAVOR20,
//     SUNRISE20, SUNRISESAVE20, 20OFFRESTOCK and 15OFFREVIEW also cover
//     single cans.

export const FREE_SHIP_THRESHOLD = 74.5; // live Shopify rate threshold (unlock logic)
export const FREE_SHIP_LABEL = 75; // what copy says (house rule)

export type Tier = 5 | 10 | 30 | 60;
export type PackKind = "single" | "4" | "12" | "20";
export type Scope = { packs: PackKind[]; tiers: Tier[] };

type Base = {
  code: string;
  /** Short line for the cart's applied-code row, e.g. "Buy 4, get 1 free". */
  label: string;
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

const pct = (code: string, percent: number, scope: Scope, label: string, minQty?: number): DealRule => ({
  kind: "percent",
  code,
  percent,
  scope,
  minQty,
  label,
});
const bxgy = (code: string, buy: number, get: number, getScope: Scope, label: string): DealRule => ({
  kind: "bxgy",
  code,
  buy,
  buyScope: FOUR_ALL,
  get,
  getScope,
  label,
});
const freeCan = (code: string): DealRule => ({
  kind: "freeCan",
  code,
  amountOff: 7.95,
  scope: SINGLE_ANY,
  label: "One free single can",
});

export const DEALS: DealRule[] = [
  // Spin & Save wheel (wheel_v2)
  bxgy("NEWCUST4P1FR", 4, 1, FOUR_ALL, "Buy 4 four-packs, get 1 free"),
  bxgy("NEWCUST2P10MG", 2, 1, FOUR_10, "Buy 2 four-packs, get a 10mg 4-pack free"),
  pct("NEWCUST2P25", 25, FOUR_ALL, "25% off 2+ four-packs", 2),
  pct("NEWCUST5P25", 25, FOUR_ALL, "25% off 5+ four-packs", 5),
  pct("NEWCUST5P30", 30, FOUR_ALL, "30% off 5+ four-packs", 5),
  pct("SRSPINWIN15OFF", 15, PACKS_ALL, "15% off packs of 20 or fewer"),
  pct("SRSPINWIN20OFF", 20, PACKS_ALL, "20% off packs of 20 or fewer"),
  // Deal-specific Meta ads (AD_DEALS in SpinWheel) + Meta test codes
  bxgy("FREE4PACK", 2, 1, FOUR_ALL, "Buy 2 four-packs, get 1 free"),
  bxgy("NCB2G1FMT", 2, 1, FOUR_ALL, "Buy 2 four-packs, get 1 free"),
  pct("25OFF5", 25, FOUR_ALL, "25% off 5+ four-packs", 5),
  pct("NC5P25MT", 25, FOUR_ALL, "25% off 5+ four-packs", 5),
  // Free can (home section, landing pages, email)
  freeCan("WEBFREECAN"),
  freeCan("TRYFREECAN"),
  freeCan("FREECAN"),
  // Email / flow codes
  pct("SAVOR20", 20, CANS_AND_PACKS_ALL, "20% off cans and packs of 20 or fewer"),
  pct("SUNRISE20", 20, CANS_AND_PACKS_ALL, "20% off cans and packs of 20 or fewer"),
  pct("SUNRISESAVE20", 20, CANS_AND_PACKS_ALL, "20% off cans and packs of 20 or fewer"),
  pct("20OFFRESTOCK", 20, CANS_AND_PACKS_ALL, "20% off cans and packs of 20 or fewer"),
  pct("25OFF5RESTOCK", 25, FOUR_EVERY, "25% off 5+ four-packs", 5),
  pct("15OFFREVIEW", 15, CANS_AND_PACKS_ALL, "15% off cans and packs of 20 or fewer"),
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
export function inScope(line: DealLine, scope: Scope): boolean {
  const p = packOf(line.variantTitle);
  const t = tierOf(line.handle);
  return !!p && !!t && scope.packs.includes(p) && scope.tiers.includes(t);
}
const count = (lines: DealLine[], scope: Scope, skip?: (l: DealLine) => boolean) =>
  lines.reduce((n, l) => (inScope(l, scope) && !skip?.(l) ? n + l.quantity : n), 0);

// ── EVALUATION ───────────────────────────────────────────────────────────
export type DealStatus = "none" | "progress" | "complete" | "na";
export type DealEval = {
  status: DealStatus;
  /** Units counted toward the requirement, and units required. */
  have: number;
  need: number;
  /** One line for the meter, e.g. "Add 2 more 4-packs to get 1 free". */
  message: string;
  /** bxgy: the cart should add the free item now. */
  addFree: boolean;
  /** bxgy: the auto-added free line no longer qualifies; remove it. */
  removeFreeLineId: string | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function evaluateDeal(rule: DealRule | null, lines: DealLine[], declinedFree = false): DealEval {
  const none: DealEval = { status: "none", have: 0, need: 0, message: "", addFree: false, removeFreeLineId: null };
  if (!rule) return none;

  if (rule.kind === "percent") {
    const have = count(lines, rule.scope);
    const need = rule.minQty ?? 1;
    if (!rule.minQty) {
      return have > 0
        ? { ...none, status: "complete", have, need, message: `${rule.percent}% off unlocked ✓` }
        : { ...none, status: "na", have, need, message: `${rule.code} gives ${rule.label}; nothing in your cart qualifies yet.` };
    }
    if (have >= need) return { ...none, status: "complete", have, need, message: `${rule.percent}% off unlocked ✓` };
    const left = need - have;
    return {
      ...none,
      status: "progress",
      have,
      need,
      message: `Add ${plural(left, "more 4-pack", "more 4-packs")} to unlock ${rule.percent}% off`,
    };
  }

  if (rule.kind === "freeCan") {
    const have = count(lines, rule.scope);
    return have > 0
      ? { ...none, status: "complete", have: 1, need: 1, message: "Free can unlocked ✓" }
      : { ...none, status: "progress", have: 0, need: 1, message: "Add any single can. It's on us." };
  }

  // bxgy
  const ours = lines.find((l) => l.freeFor?.toUpperCase() === rule.code.toUpperCase()) ?? null;
  const paid = count(lines, rule.buyScope, (l) => l === ours);
  const total = count(lines, rule.buyScope); // includes the auto-added free line
  const getHave = count(lines, rule.getScope);
  const complete = total >= rule.buy + rule.get && getHave >= rule.get;
  const need = rule.buy + rule.get;
  const freeWord = rule.getScope.tiers.length === 1 && rule.getScope.tiers[0] === 10 ? "10mg 4-pack" : "4-pack";
  if (ours && paid < rule.buy) {
    return {
      ...none,
      status: "progress",
      have: paid,
      need,
      message: `Add ${plural(rule.buy - paid, "more 4-pack", "more 4-packs")} to keep your free ${freeWord}`,
      removeFreeLineId: ours.id,
    };
  }
  if (complete) return { ...none, status: "complete", have: need, need, message: `Free ${freeWord} unlocked ✓` };
  if (paid >= rule.buy) {
    return {
      ...none,
      status: "progress",
      have: paid,
      need,
      message: declinedFree ? `Your free ${freeWord} is waiting. Add it below.` : `Adding your free ${freeWord}…`,
      addFree: !declinedFree,
    };
  }
  return {
    ...none,
    status: "progress",
    have: paid,
    need,
    message: `Add ${plural(rule.buy - paid, "more 4-pack", "more 4-packs")} to get a free ${freeWord}`,
  };
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
