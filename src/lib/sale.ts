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

import { tierOf } from "./deals";

export const SALE_ENABLED = true;

export type SaleChannel = "site" | "klaviyo" | "brevo";
export type SalePair = { all: string; ten: string };
/** Tiers the "all" code covers (5mg is not in the sale). */
export const SALE_ALL_TIERS = [30, 60] as const;
/** Shopper words for the "all" tiers, used in every sale line. */
export const SALE_ALL_LABEL = "30mg + 60mg";

export type SalePhase = {
  id: "launch" | "blackfriday";
  /** ISO times with the Central offset; Shopify start/end must match exactly. */
  starts: string;
  ends: string;
  pctAll: number;
  pctTen: number;
  name: string;
  /** Off = the phase never shows, even inside its dates. Turn a phase on only
   *  after its Shopify codes exist and pass a live cart test. */
  enabled: boolean;
  pairs: Record<SaleChannel, SalePair>;
};

// CODE NAMES ARE PROPOSALS until created in Shopify. Shoppers see them at
// checkout, so they read as perks, not tracking tags.
export const SALE_PHASES: SalePhase[] = [
  {
    id: "launch",
    starts: "2026-11-13T00:00:00-06:00",
    ends: "2026-11-26T00:00:00-06:00",
    pctAll: 30,
    pctTen: 60,
    name: "Holiday Sale",
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

/** Federal date for sale copy. NOT SHOWN anywhere (founder, Nov 13): the
 *  Dec 11 line comes back only after the founder proofreads it. */
export const FEDERAL_DATE_LABEL = "December 11";

const CHANNEL_KEY = "sunrise:sale-channel";
const CHANNEL_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SALE_EVENT = "sunrise:sale-change";

// ── phase ────────────────────────────────────────────────────────────────
export function activeSale(now: number = Date.now()): SalePhase | null {
  if (!SALE_ENABLED) return null;
  return (
    SALE_PHASES.find((p) => p.enabled && now >= Date.parse(p.starts) && now < Date.parse(p.ends)) ?? null
  );
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
  if (hasTen) out.push(pair.ten);
  return out;
}

/** % off for a product tier during the sale (0 when none). Display only:
 *  Shopify's cart is always the judge of the real total. */
export function salePercentFor(
  tier: number | null | undefined,
  phase: SalePhase | null = activeSale(),
): number {
  if (!phase || tier == null) return 0;
  if (tier === 10) return phase.pctTen;
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
