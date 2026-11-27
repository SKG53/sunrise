// SITEWIDE SALE (Nov 2026): the one file to edit for the sale.
//
// Founder rules (Nov 13 2026):
//   - One deal for everyone, applied automatically: X% off every 30mg and
//     60mg drink (all pack sizes, up to the 80-pack), and Y% off all 10mg.
//     5mg is NOT in the sale (founder, Nov 13 11 AM). No other codes, no spin wheel.
//   - List prices never change. Two Shopify codes do the work, and the cart
//     applies them for the shopper (no typing).
//   - Three code pairs with the SAME values, so Shopify reports which channel
//     sold: "site" (anyone without an email link), "klaviyo" (SUNRISE's own
//     customers), "brevo" (legacy lists). Prices are identical in all three.
//   - Black Friday steps up to deeper values with its own pairs, so Shopify's
//     start/end dates switch it on with nothing to edit at midnight.
//
// Shopify setup each pair needs (see the runbook):
//   - "all" code: Amount off products, X%, applies to the 12 30mg and 60mg
//     products only. Combines with: product discounts.
//   - "ten" code: Amount off products, Y%, applies to 10mg products only.
//     Combines with: product discounts.
//   - No minimum, no usage limit, start/end = this file's phase dates.
//   The two scopes must never overlap (Shopify allows one product discount
//   per line).
//
// How a shopper gets a channel (lib/sale.ts captureSaleChannel, run in __root):
//   1. ?code= / ?deal= holding ANY code below (or a legacy alias) → that channel.
//   2. Else utm_source=brevo → brevo; utm_source=klaviyo or _kx → klaviyo.
//   3. Else nothing changes (a saved email channel is kept 30 days; a visitor
//      with none is "site").
// The cart sends only the codes the cart can use: "all" when a non-10mg drink
// is in it, "ten" when a 10mg drink is in it, both together in one update.
//
// To end the sale: set SALE_ENABLED = false. The old deal wallet takes over
// again (it is untouched underneath).
//
// NOTHING SWITCHES ON OR OFF BY DATE (founder, Nov 19 2026: "Don't make any
// section or element disappear automatically at any time. Not sales, not
// pills, not anything."). The phase dates below are a record of the Shopify
// code dates only; the site shows the first enabled phase until someone
// changes SALE_ENABLED or a phase's `enabled` by hand. Keep ONE phase enabled.

import { tierOf } from "./deals";

export const SALE_ENABLED = true;

/** BLACK FRIDAY MEGA SALE (lib/megaSale.ts): a FREE 4-pack for every $100 of
 *  30mg + 60mg after the 30% OFF. Manual flag only (founder flips it Monday
 *  night). false = no Mega messaging, and gifts come out of every cart with
 *  a notice. Publish this flip BEFORE drafting the FREE 4-Pack in Shopify. */
export const MEGA_SALE_ENABLED = true;

export type SaleChannel = "site" | "klaviyo" | "brevo";
export type SalePair = { all: string; ten: string };
/** Tiers the "all" code covers (5mg is not in the sale). */
export const SALE_ALL_TIERS = [30, 60] as const;
/** Shopper words for the "all" tiers, used in every sale line. */
export const SALE_ALL_LABEL = "30mg + 60mg";

export type SalePhase = {
  id: "launch" | "blackfriday";
  /** ISO times with the Central offset, recorded to match the Shopify codes.
   *  Informational only: the site never turns a phase on or off by date. */
  starts: string;
  ends: string;
  pctAll: number;
  pctTen: number;
  name: string;
  /** The only switch (with SALE_ENABLED). Turn a phase on only after its
   *  Shopify codes exist and pass a live cart test, and turn the other off. */
  enabled: boolean;
  pairs: Record<SaleChannel, SalePair>;
};

// CODE NAMES ARE PROPOSALS until created in Shopify. Shoppers see them at
// checkout, so they read as perks, not tracking tags.
export const SALE_PHASES: SalePhase[] = [
  {
    id: "launch",
    starts: "2026-11-13T00:00:00-06:00",
    // Record only (switches nothing): Shopify codes now end Dec 8 11:59:59 PM
    // CT (founder, Nov 23). Site messaging says Dec 6 (ORDER_DEADLINE below).
    // Was 2026-12-03T00:00:00-06:00 (Nov 17), 2026-11-26 before that.
    ends: "2026-12-09T00:00:00-06:00",
    pctAll: 30,
    // 10mg is no longer sold (founder, Nov 25: "Remove the 60% OFF badges and
    // text too"). The "ten" codes SAVE60 / SUNRISE60 / HOLIDAY60 EXPIRED in
    // Shopify Nov 23 11:59:59 PM CT. 0 = no 10mg deal anywhere (bar, popup,
    // sale blocks, cart cards, upsell, PDP prices) and the cart never sends a
    // "ten" code. Was 60.
    pctTen: 0,
    // Shown as "BLACK FRIDAY SALE" everywhere (founder, Nov 23; first asked
    // Nov 14). Was "Holiday Sale".
    name: "Black Friday Sale",
    enabled: true,
    pairs: {
      site: { all: "SAVE30", ten: "SAVE60" },
      klaviyo: { all: "SUNRISE30", ten: "SUNRISE60" },
      brevo: { all: "HOLIDAY30", ten: "HOLIDAY60" },
    },
  },
  {
    // Values are placeholders inside the founder's range (40–45% / 65–70%).
    id: "blackfriday",
    starts: "2026-11-26T00:00:00-06:00",
    ends: "2026-12-01T00:00:00-06:00",
    pctAll: 40,
    pctTen: 65,
    name: "Black Friday Sale",
    // OFF until the BF codes exist in Shopify (review B3, Nov 13).
    enabled: false,
    pairs: {
      site: { all: "BFSAVE", ten: "BFSAVE10" },
      klaviyo: { all: "BFSUNRISE", ten: "BFSUNRISE10" },
      brevo: { all: "BFHOLIDAY", ten: "BFHOLIDAY10" },
    },
  },
];

/** Old codes still in sent emails → the channel they came from. */
const LEGACY_ALIASES: Record<string, SaleChannel> = {
  HOLIDAY20: "brevo", // Nov 12 screening email (Brevo campaign 331)
};

/** Federal date. Shown in the FederalDateNotice section on home and /products
 *  (approved Nov 18 2026); still NOT in the bar or popup. Change both lines
 *  together if the date moves. */
// Nov 19 2026 (founder): pill reads "DECEMBER 2026" everywhere (was "December 11").
// Unused since Nov 23 (FederalDateNotice replaced by OrderCountdown); kept for the record.
export const FEDERAL_DATE_LABEL = "December 2026";

/** Last day to order, shown on the OrderCountdown (founder, Nov 23 2026).
 *  Fixed instant: Sun Dec 6 2026, 11:59:59 PM Central, the same for every
 *  visitor whatever their time zone. If the date moves, edit these two lines.
 *  At zero the clock stops at 00 and STAYS (founder, Nov 19): take it down by hand. */
export const ORDER_DEADLINE = "2026-12-06T23:59:59-06:00";
export const ORDER_DEADLINE_LABEL = "Sunday, Dec 6 · 11:59 PM CT";

/** Tiers with no Add to Your Cart button on their product pages (founder,
 *  Nov 25 2026: "Keep everything the exact same, just remove the ADD TO YOUR
 *  CART buttons from all 10mg pages. No longer selling them."). Changed by
 *  hand only. Everything else on those pages stays (pack sizes, Qty, price);
 *  the cart offers no 10mg picks. Was [] until Nov 25. */
export const NO_BUY_TIERS: readonly number[] = [10];
/** Tiers whose product pages don't show the Dec 6 countdown: 10mg's last day
 *  to order is Nov 23, not Dec 6. */
export const NO_COUNTDOWN_TIERS: readonly number[] = [10];
export function canBuyTier(tier: number | null | undefined): boolean {
  return tier == null || !NO_BUY_TIERS.includes(tier);
}

const CHANNEL_KEY = "sunrise:sale-channel";
const CHANNEL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SALE_EVENT = "sunrise:sale-change";

// ── phase ────────────────────────────────────────────────────────────────
/** The sale on the site right now: the first enabled phase, regardless of
 *  date (no automatic start or end, founder Nov 19). */
export function activeSale(): SalePhase | null {
  if (!SALE_ENABLED) return null;
  return SALE_PHASES.find((p) => p.enabled) ?? null;
}

/** Old offers (deal wallet, chooser, deal banner, free-can and Build Your Box
 *  pages, spin wheel) stay paused for as long as SALE_ENABLED is true, not
 *  just inside a phase's dates: their codes are disabled in Shopify, so after
 *  a phase ends the site shows no deal rather than dead ones (review B4). */
export function legacyOffersPaused(): boolean {
  return SALE_ENABLED;
}

/** Every code any phase uses, upper-cased. */
const ALL_CODES: Map<string, SaleChannel> = (() => {
  const m = new Map<string, SaleChannel>();
  for (const p of SALE_PHASES) {
    for (const ch of Object.keys(p.pairs) as SaleChannel[]) {
      m.set(p.pairs[ch].all.toUpperCase(), ch);
      m.set(p.pairs[ch].ten.toUpperCase(), ch);
    }
  }
  return m;
})();
export function isSaleCode(code: string | null | undefined): boolean {
  return !!code && ALL_CODES.has(code.trim().toUpperCase());
}

// ── channel ──────────────────────────────────────────────────────────────
function readChannel(): SaleChannel {
  if (typeof window === "undefined") return "site";
  try {
    const v = JSON.parse(localStorage.getItem(CHANNEL_KEY) || "null") as {
      ch?: string;
      ts?: number;
    } | null;
    if (
      v &&
      (v.ch === "klaviyo" || v.ch === "brevo") &&
      typeof v.ts === "number" &&
      Date.now() - v.ts <= CHANNEL_TTL_MS
    ) {
      return v.ch;
    }
  } catch {
    /* private mode */
  }
  return "site";
}
function writeChannel(ch: SaleChannel) {
  try {
    if (ch === "site") localStorage.removeItem(CHANNEL_KEY);
    else localStorage.setItem(CHANNEL_KEY, JSON.stringify({ ch, ts: Date.now() }));
  } catch {
    /* private mode: this page view still gets the right codes below */
  }
  try {
    window.dispatchEvent(new CustomEvent(SALE_EVENT));
  } catch {
    /* old browser */
  }
}
let sessionChannel: SaleChannel | null = null; // survives private mode for this page

export function saleChannel(): SaleChannel {
  return sessionChannel ?? readChannel();
}

/** Reads the URL once per navigation. Returns true when it set a channel. */
export function captureSaleChannel(search: string): boolean {
  if (!SALE_ENABLED || typeof window === "undefined") return false;
  let ch: SaleChannel | null = null;
  try {
    const q = new URLSearchParams(search);
    const code = (q.get("code") ?? q.get("deal") ?? "").trim().toUpperCase();
    if (code) ch = ALL_CODES.get(code) ?? LEGACY_ALIASES[code] ?? null;
    if (!ch) {
      const src = (q.get("utm_source") || "").toLowerCase();
      if (src === "brevo") ch = "brevo";
      else if (src === "klaviyo" || q.has("_kx")) ch = "klaviyo";
    }
  } catch {
    return false;
  }
  if (!ch || ch === "site") return false;
  sessionChannel = ch;
  if (ch !== readChannel()) writeChannel(ch);
  return true;
}

// ── cart ─────────────────────────────────────────────────────────────────
type LineLike = { productHandle: string };

/** The codes this cart should carry right now (empty when no sale is on). */
export function saleCodesFor(items: LineLike[], phase: SalePhase | null = activeSale()): string[] {
  if (!phase) return [];
  const pair = phase.pairs[saleChannel()];
  let hasTen = false;
  let hasOther = false;
  for (const i of items) {
    const t = tierOf(i.productHandle);
    if (t === 10) hasTen = true;
    else if (t !== null && (SALE_ALL_TIERS as readonly number[]).includes(t)) hasOther = true;
  }
  const out: string[] = [];
  if (hasOther) out.push(pair.all);
  if (hasTen && phase.pctTen > 0) out.push(pair.ten);
  return out;
}

/** % off for a product tier during the sale (0 when none). Display only:
 *  Shopify's cart is always the judge of the real total. */
export function salePercentFor(
  tier: number | null | undefined,
  phase: SalePhase | null = activeSale(),
): number {
  if (!phase || tier == null) return 0;
  if (tier === 10) return phase.pctTen; // 0 since Nov 23 (10mg out of the sale)
  return (SALE_ALL_TIERS as readonly number[]).includes(tier) ? phase.pctAll : 0;
}
/** List price minus Shopify's discount. Shopify rounds the discount amount
 *  half-to-even to the cent (verified live Nov 13: $24.95 × 30% = 7.485 → $7.48
 *  off, $458.95 × 30% = 137.685 → $137.68 off). */
export function salePrice(list: number, pct: number): number {
  const raw = Math.round(list * pct * 10) / 10; // discount in cents (pct is 30, not 0.3), 1 decimal
  const floor = Math.floor(raw);
  const frac = Math.round((raw - floor) * 10);
  const cents = frac > 5 ? floor + 1 : frac < 5 ? floor : floor % 2 === 0 ? floor : floor + 1;
  return Math.round(list * 100 - cents) / 100;
}

/** Same-set comparison for discount codes (order and case don't matter). */
export function sameCodes(a: string[], b: string[]): boolean {
  const A = a.map((c) => c.toUpperCase()).sort();
  const B = b.map((c) => c.toUpperCase()).sort();
  return A.length === B.length && A.every((c, i) => c === B[i]);
}

// ── paused pages ─────────────────────────────────────────────────────────
// Free-can and Build Your Box pages advertise codes that are disabled during
// the sale. Their routes call this in beforeLoad: while a phase is on they
// send the visitor to /products, keeping the query string (UTMs, ?code=).
export function pausedForSale(searchStr: string): string | null {
  return legacyOffersPaused() ? `/products${searchStr}` : null;
}
