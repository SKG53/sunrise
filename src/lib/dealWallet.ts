// DEAL WALLET — every code this browser has claimed, so the cart can apply it
// without the shopper typing anything.
//
// localStorage `sunrise:deal-wallet`:
//   { entries: [{ code, source, ts }], active: string | null }
//
// Filled by:
//   - Spin & Save / ad-deal claim  (SpinWheel)        source "wheel" / "ad"
//   - Free-can claim               (FreeSampleSection) source "freecan"
//   - Build Your Box unlock        (BuildYourBox)      source "box"
//   - Email / ad links: ?code=CODE or ?deal=CODE       source "link"
//     (captureDealFromUrl, __root). Only codes listed in lib/deals.ts are
//     accepted; the param is stripped from the address bar afterwards.
//
// Shopify codes don't combine, so ONE code is active at a time: the most
// recently claimed, unless the shopper picks another in the cart or removes
// it (active = null → nothing is re-applied until a new claim).
// Entries expire after 60 days. Never throws.

import { dealByCode } from "./deals";

export type WalletSource = "wheel" | "ad" | "freecan" | "box" | "link";
export type WalletEntry = { code: string; source: WalletSource; ts: number };
type Wallet = { entries: WalletEntry[]; active: string | null };

const KEY = "sunrise:deal-wallet";
const TTL_MS = 60 * 24 * 60 * 60 * 1000;
export const WALLET_EVENT = "sunrise:wallet-change";

function read(): Wallet {
  if (typeof window === "undefined") return { entries: [], active: null };
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Partial<Wallet>) : {};
    const now = Date.now();
    const entries = (Array.isArray(v.entries) ? v.entries : []).filter(
      (e): e is WalletEntry =>
        !!e && typeof e.code === "string" && typeof e.ts === "number" && now - e.ts <= TTL_MS && !!dealByCode(e.code),
    );
    const active = typeof v.active === "string" && entries.some((e) => e.code === v.active) ? v.active : null;
    return { entries, active };
  } catch {
    return { entries: [], active: null };
  }
}

function write(w: Wallet) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* private mode — the code still shows on screen */
  }
  try {
    window.dispatchEvent(new CustomEvent(WALLET_EVENT));
  } catch {
    /* old browser */
  }
}

/** Adds (or refreshes) a code and makes it the active one. */
export function addToWallet(code: string, source: WalletSource): void {
  if (typeof window === "undefined") return;
  const rule = dealByCode(code);
  if (!rule) return;
  const w = read();
  const entries = w.entries.filter((e) => e.code !== rule.code);
  entries.push({ code: rule.code, source, ts: Date.now() });
  write({ entries, active: rule.code });
}

export function getActiveCode(): string | null {
  return read().active;
}

export function listWallet(): WalletEntry[] {
  return read().entries.slice().sort((a, b) => b.ts - a.ts);
}

/** Pick another saved code, or null to apply none. */
export function setActiveCode(code: string | null): void {
  const w = read();
  if (code !== null && !w.entries.some((e) => e.code === code)) return;
  write({ ...w, active: code });
}

/** Called after an order completes: the used code is spent. */
export function forgetCode(code: string): void {
  const w = read();
  const entries = w.entries.filter((e) => e.code.toUpperCase() !== code.toUpperCase());
  write({ entries, active: w.active && w.active.toUpperCase() === code.toUpperCase() ? null : w.active });
}

/** ?code= / ?deal= on any page → wallet, then strip the param. Call once on load. */
export function captureDealFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("code") ?? url.searchParams.get("deal");
    if (!raw) return null;
    const rule = dealByCode(raw);
    url.searchParams.delete("code");
    url.searchParams.delete("deal");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    if (!rule) return null;
    addToWallet(rule.code, "link");
    return rule.code;
  } catch {
    return null;
  }
}
