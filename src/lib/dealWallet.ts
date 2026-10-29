// DEAL WALLET — every code this browser has claimed, so the cart can apply it
// without the shopper typing anything.
//
// localStorage `sunrise:deal-wallet`:
//   { entries: [{ code, source, ts, box? }], active, choice }
//
// Filled by:
//   - Spin & Save / ad-deal claim  (SpinWheel)         source "wheel" / "ad"
//   - Free-can claim               (FreeSampleSection) source "freecan"
//   - Build Your Box unlock        (BuildYourBox)      source "box" (or keeps the
//                                                       original source + box:true)
//   - Email / ad links: ?code=CODE or ?deal=CODE        source "link"
//     (captured in __root on every navigation; only codes in lib/deals.ts).
//
// Rules (founder, Oct 28–29):
//   - ONE code at a time (Shopify codes here never combine). The shopper's
//     latest claim wins, and they can switch in the cart.
//   - NO SILENT CHANGES. Whenever the active deal changes for any reason other
//     than the shopper picking it in the cart, a notice explains it
//     (pushNotice → shown at the top of the cart).
//   - A free-can claim never replaces another active deal. It is saved
//     inactive and the cart asks: "One deal per order. Which one?"
// Entries expire after 60 days. Never throws.

import { dealByCode } from "./deals";

export type WalletSource = "wheel" | "ad" | "freecan" | "box" | "link";
export type WalletEntry = { code: string; source: WalletSource; ts: number; box?: boolean };
export type WalletChoice = { codes: string[]; preselect: string; reason: "new-claim" | "singles-cart" };
type Wallet = { entries: WalletEntry[]; active: string | null; choice: WalletChoice | null };

const KEY = "sunrise:deal-wallet";
const NOTICE_KEY = "sunrise:deal-notices";
const TTL_MS = 60 * 24 * 60 * 60 * 1000;
export const WALLET_EVENT = "sunrise:wallet-change";

const label = (code: string) => dealByCode(code)?.label ?? code;

function read(): Wallet {
  if (typeof window === "undefined") return { entries: [], active: null, choice: null };
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? (JSON.parse(raw) as Partial<Wallet>) : {};
    const now = Date.now();
    const entries = (Array.isArray(v.entries) ? v.entries : []).filter(
      (e): e is WalletEntry =>
        !!e && typeof e.code === "string" && typeof e.ts === "number" && now - e.ts <= TTL_MS && !!dealByCode(e.code),
    );
    const has = (c: unknown) => typeof c === "string" && entries.some((e) => e.code === c);
    const active = has(v.active) ? (v.active as string) : null;
    const ch = v.choice;
    const choice =
      ch && Array.isArray(ch.codes) && ch.codes.filter(has).length > 1 && has(ch.preselect)
        ? { codes: ch.codes.filter(has), preselect: ch.preselect, reason: ch.reason === "singles-cart" ? "singles-cart" : "new-claim" }
        : null;
    return { entries, active, choice: choice as WalletChoice | null };
  } catch {
    return { entries: [], active: null, choice: null };
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

// ── notices (no silent changes) ──────────────────────────────────────────
export function pushNotice(text: string): void {
  if (typeof window === "undefined") return;
  try {
    const cur = takeNotices(false);
    if (!cur.includes(text)) cur.push(text);
    localStorage.setItem(NOTICE_KEY, JSON.stringify(cur.slice(-4)));
    window.dispatchEvent(new CustomEvent(WALLET_EVENT));
  } catch {
    /* private mode */
  }
}
/** Read notices; with clear=true they're removed (the cart showed them). */
export function takeNotices(clear = true): string[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(NOTICE_KEY) || "[]");
    if (clear) localStorage.removeItem(NOTICE_KEY);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Adds (or refreshes) a claimed code.
 *  - Keeps the ORIGINAL source if the code is already saved (wheel → box keeps
 *    "wheel" for attribution; `box: true` marks that it went through a box).
 *  - Free can: saved inactive when another deal is active → the cart asks.
 *  - Anything else becomes active (latest claim wins); if that replaces a
 *    different active deal, a notice says so.
 */
export function addToWallet(code: string, source: WalletSource, opts: { box?: boolean } = {}): void {
  if (typeof window === "undefined") return;
  const rule = dealByCode(code);
  if (!rule) return;
  const w = read();
  const prev = w.entries.find((e) => e.code === rule.code);
  const entry: WalletEntry = {
    code: rule.code,
    source: prev?.source ?? source,
    ts: Date.now(),
    box: prev?.box || opts.box || undefined,
  };
  const entries = [...w.entries.filter((e) => e.code !== rule.code), entry];
  const otherActive = w.active && w.active !== rule.code ? w.active : null;

  if (rule.kind === "freeCan" && otherActive && dealByCode(otherActive)?.kind !== "freeCan") {
    write({
      entries,
      active: w.active,
      choice: { codes: [otherActive, rule.code], preselect: otherActive, reason: "new-claim" },
    });
    return;
  }
  if (otherActive) {
    pushNotice(`Your new deal is on: ${rule.label}. Your earlier deal (${label(otherActive)}) is saved. Switch anytime under "Your deals".`);
  }
  write({ entries, active: rule.code, choice: null });
}

export function getActiveCode(): string | null {
  return read().active;
}
export function getWalletEntry(code: string | null): WalletEntry | null {
  if (!code) return null;
  return read().entries.find((e) => e.code.toUpperCase() === code.toUpperCase()) ?? null;
}
export function listWallet(): WalletEntry[] {
  return read().entries.slice().sort((a, b) => b.ts - a.ts);
}
export function getChoice(): WalletChoice | null {
  return read().choice;
}

/** The shopper picked a deal in the cart (or "No code"). Clears any open choice. */
export function setActiveCode(code: string | null): void {
  const w = read();
  if (code !== null && !w.entries.some((e) => e.code === code)) return;
  write({ ...w, active: code, choice: null });
}

/** Ask the shopper to choose (never switches by itself). */
export function askChoice(codes: string[], preselect: string, reason: WalletChoice["reason"]): void {
  const w = read();
  const valid = codes.filter((c) => w.entries.some((e) => e.code === c));
  if (valid.length < 2 || !valid.includes(preselect)) return;
  write({ ...w, choice: { codes: valid, preselect, reason } });
}
export function dismissChoice(): void {
  const w = read();
  if (w.choice) write({ ...w, choice: null });
}

/** Code is spent (Shopify said this email already used it, or the order went through). */
export function forgetCode(code: string, notice?: string): void {
  const w = read();
  const entries = w.entries.filter((e) => e.code.toUpperCase() !== code.toUpperCase());
  const wasActive = !!w.active && w.active.toUpperCase() === code.toUpperCase();
  write({ entries, active: wasActive ? null : w.active, choice: null });
  if (notice) pushNotice(notice);
}

/** ?code= / ?deal= value → wallet (allowlisted). __root strips the param. */
export function captureDealCode(raw: string | null): string | null {
  if (!raw) return null;
  const rule = dealByCode(raw);
  if (!rule) return null;
  addToWallet(rule.code, "link");
  return rule.code;
}
