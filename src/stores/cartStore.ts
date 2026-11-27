// CART STORE — site pass 2 (Oct 29 2026).
//
// ONE CART, MANY VIEWS (founder rule): the cart icon's drawer and every
// landing/Build-Your-Box page read and write THIS store, so the cart is
// accurate wherever the shopper looks.
//
// How it works:
//   1. Shopify's cart is the source of truth. Every mutation returns the whole
//      cart (lib/shopify.ts CART_FIELDS) and the store renders Shopify's own
//      numbers.
//   2. SINGLE-FILE QUEUE (review 1.8). Every cart operation — sync, adds,
//      edits, code changes, free-pack handling, checkout prep — runs one at a
//      time through `enqueue`. Nothing overlaps, so a later answer can't paint
//      over a newer cart, the free pack can't be added twice, and checkout
//      waits until the code and free pack are on the cart (8 s cap, then an
//      error with retry).
//   3. LOAD GATE (review 1.7). Nothing touches the cart until the first sync
//      after page load has run. A cart that's gone (completed or expired) is
//      cleared first. A missing cart is only REBUILT from the browser's copy
//      if it was confirmed alive during this visit (real mid-shopping expiry);
//      otherwise a new cart starts with just the new lines.
//   4. CODES. SALE MODE (lib/sale.ts, Nov 2026) wins while a sale phase is
//      on: the cart carries the channel's sale pair (the codes the cart can
//      use, sent together in ONE cartDiscountCodesUpdate), the wallet is
//      ignored, any other code is replaced, and old free packs come out.
//      Otherwise: the wallet's active code is applied (one at a time). Codes we
//      don't know (e.g. personal codes) are left alone; the cart offers the
//      saved deal instead of overwriting.
//   5. USED CODES (review 1.3). The shopper's email goes on the Shopify cart as
//      soon as we know it. Shopify then reports a once-per-customer code that
//      email already used (warning DISCOUNT_CUSTOMER_USAGE_LIMIT_REACHED),
//      even before the cart qualifies — verified live Oct 29. The cart then
//      removes the code and any free pack, forgets the code, and says why.
//      Checked once per cart/code/email even after a reload.
//   6. FREE PACK (buy X get Y). Added once the paid side qualifies (line
//      attribute `_sr_free`), clamped to the deal's quantity. Shopify frees the
//      cheapest qualifying pack, so: the shopper may pick any flavor priced at
//      or below the cheapest paid pack (an equal-priced pick is kept); a free
//      pack priced ABOVE it is switched, with a notice. If paid packs alone
//      already cover buy + get, our extra pack comes out, with a notice. If the
//      shopper removes it, it isn't re-added for THIS cart (localStorage, keyed
//      cartId|code), and the drawer offers it back.
//   7. NO SILENT CHANGES. Every change the shopper didn't make themselves comes
//      with a notice (lib/dealWallet pushNotice → top of the cart).
//   8. checkout(): email on the cart (Shopify prefills it), attribution
//      attributes, Started Checkout, SAME-TAB redirect.
//   9. Events: Added to Cart (one per add action), Removed from Cart, Started
//      Checkout (GA4 pushes cleared first), Deal Progress / Deal Unlocked /
//      Reached Free Shipping (deduped per cart).
//  10. Other tabs (fix Oct 29): a cart change in another tab is picked up only
//      when lines, codes or email changed, never for a new checkout-link key
//      alone (that made two open tabs re-sync each other ~4×/second).
//  11. BLACK FRIDAY MEGA SALE (Nov 27, lib/megaSale.ts): a FREE 4-pack line
//      (quantity 1, `_sr_gift`=BFMEGA, `_sr_gift_slot`=1,2,…) for every $100
//      of 30mg + 60mg after discounts, settled in step 2b. Extras come out
//      (notice only when spend actually fell under a $100 step), drift is
//      normalized, missing gifts are added in one call with the cart's
//      top flavor. A gift keeps its flavor until the shopper changes it. No
//      analytics events for any of this. A failed add shows one notice and
//      isn't retried until the page reloads or the earned count changes.
//      `_bf_mega_spend` / `_bf_mega_gifts` go on the order via
//      buildAttributes() at checkout (one write, so nothing is erased).

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { trackEcommerce } from "@/lib/track";
import { siteEvent } from "@/lib/siteEvents";
import { knownEmail, setIdentityEmail, subscribeIdentity } from "@/lib/identity";
import { readUtms, readSessionUtms, isAdVisitor, isEmailVisitor } from "@/lib/utms";
import {
  askChoice,
  dropNotices,
  forgetCode,
  getActiveCode,
  getChoice,
  getWalletEntry,
  listWallet,
  pushNotice,
  WALLET_EVENT,
} from "@/lib/dealWallet";
import {
  cheapestPaidLine,
  cheapestPaidPrice,
  dealByCode,
  evaluateDeal,
  freeShipState,
  packOf,
  type DealEval,
  type DealLine,
  type DealRule,
} from "@/lib/deals";
import { FREE_10MG, packByVariantId } from "@/lib/liveFourPacks";
import { activeSale,
  legacyOffersPaused, MEGA_SALE_ENABLED, saleChannel, saleCodesFor, sameCodes, SALE_EVENT } from "@/lib/sale";
import {
  defaultGift,
  earnedGifts,
  giftByVariant,
  GIFT_ATTR,
  GIFT_SLOT_ATTR,
  GIFT_VALUE,
  isGiftLine,
  MEGA_COPY,
  qualifyingCents,
} from "@/lib/megaSale";
import {
  cartAttributesUpdateFull,
  cartBuyerIdentityUpdateFull,
  cartCreateFull,
  cartDiscountCodesUpdateFull,
  cartLinesAddFull,
  cartLinesRemoveFull,
  cartLinesUpdateFull,
  fetchCart,
  STOCK_WARNINGS,
  USED_CODE_WARNING,
  type CartResult,
  type CartView,
  type CartWarning,
  type NewLine,
} from "@/lib/shopify";

const FREE_ATTR = "_sr_free";
const DECLINED_KEY = "sunrise:free-declined"; // localStorage: ["cartId|CODE", …]
const EVENTS_KEY = "sunrise:cart-events"; // sessionStorage: event de-dupe keys
const PENDING_CHECKOUT_KEY = "sunrise:checkout-pending"; // localStorage: {cartId, code, at}
const SINGLES_ASKED_KEY = "sunrise:singles-asked"; // sessionStorage: cartIds already asked
const CHECKOUT_TIMEOUT_MS = 8000;
const FORGET_WINDOW_MS = 2 * 60 * 60 * 1000;
const MAX_PASSES = 6;
const MEGA_TOAST_KEY = "sunrise:mega-toast"; // sessionStorage: first-gift toast shown
/** A Mega "dropped below $X" notice is about the cart as it WAS: it clears as
 *  soon as the shopper changes the cart again (Nov 27 review). A new drop
 *  pushes a fresh one. */
const clearMegaDropNotices = () =>
  dropNotices((t) => t.startsWith("Your cart dropped below $") && t.endsWith("so we took out a free 4-pack."));

export interface CartItem {
  lineId: string | null;
  variantId: string;
  productId?: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string | null;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
  /** Shopify line total after discounts. */
  lineTotal?: number;
  lineDiscount?: number;
  /** Code this line was auto-added for, else null. */
  freeFor?: string | null;
  /** Mega Sale gift tag (`_sr_gift`) and slot (`_sr_gift_slot`), when set. */
  giftTag?: string | null;
  giftSlot?: string | null;
  /** Variant compare-at price (FREE 4-Pack: the 4-pack it stands for). */
  compareAt?: number | null;
}

export type AddInput = Omit<
  CartItem,
  "lineId" | "lineTotal" | "lineDiscount" | "freeFor" | "productId" | "giftTag" | "giftSlot" | "compareAt"
> & {
  /** Build Your Box free pick: the deal code it's free under (tagged `_sr_free`). */
  freeFor?: string | null;
};
type AddOpts = { open?: boolean };

interface CartStore {
  items: CartItem[];
  cart: CartView | null;
  cartId: string | null;
  checkoutUrl: string | null;
  isOpen: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  isCheckingOut: boolean;
  error: string | null;
  /** A code on the cart that isn't one of our deals (e.g. a personal code). */
  foreignCode: string | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddInput, opts?: AddOpts) => Promise<boolean>;
  /** Several items as ONE add action (Build Your Box). */
  addItems: (items: AddInput[], opts?: AddOpts) => Promise<boolean>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  swapFreeItem: (lineId: string, variantId: string) => Promise<void>;
  /** Mega Sale: change a gift's flavor (same line, both attributes kept). */
  changeGiftFlavor: (lineId: string, variantId: string) => Promise<void>;
  /** Mega Sale: "FREE 4-pack added!" message, shown once per browser session. */
  megaToast: string | null;
  dismissMegaToast: () => void;
  restoreFreeItem: () => Promise<void>;
  /** Replace a foreign code with the saved deal (shopper's choice). */
  useSavedDeal: () => Promise<void>;
  reconcile: () => Promise<void>;
  checkout: (details?: { email?: string }) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

// ── small helpers ────────────────────────────────────────────────────────
function toItems(cart: CartView | null): CartItem[] {
  if (!cart) return [];
  return cart.lines.map((l) => ({
    lineId: l.lineId,
    variantId: l.variantId,
    productId: l.productId,
    productHandle: l.productHandle,
    productTitle: l.productTitle,
    variantTitle: l.variantTitle,
    imageUrl: l.imageUrl,
    price: l.price,
    quantity: l.quantity,
    selectedOptions: l.selectedOptions,
    lineTotal: l.lineTotal,
    lineDiscount: l.lineDiscount,
    freeFor: l.attributes[FREE_ATTR] || null,
    giftTag: l.attributes[GIFT_ATTR] || null,
    giftSlot: l.attributes[GIFT_SLOT_ATTR] || null,
    compareAt: l.compareAt ?? null,
  }));
}

export function dealLines(items: CartItem[]): DealLine[] {
  return items.map((i) => ({
    id: i.lineId ?? i.variantId,
    variantId: i.variantId,
    handle: i.productHandle,
    variantTitle: i.variantTitle,
    quantity: i.quantity,
    unitPrice: Number(i.price.amount),
    freeFor: i.freeFor ?? null,
  }));
}

const readJSON = <T,>(store: Storage | undefined, key: string, fallback: T): T => {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (store: Storage | undefined, key: string, value: unknown) => {
  try {
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
};
const ls = () => (typeof window !== "undefined" ? window.localStorage : undefined);
const ss = () => (typeof window !== "undefined" ? window.sessionStorage : undefined);

// Declined free pack: scoped to the cart (review2 1.6).
export function isFreeDeclined(cartId: string | null, code: string | null): boolean {
  if (!cartId || !code) return false;
  return readJSON<string[]>(ls(), DECLINED_KEY, []).includes(`${cartId}|${code.toUpperCase()}`);
}
function setFreeDeclined(cartId: string, code: string, declined: boolean) {
  const key = `${cartId}|${code.toUpperCase()}`;
  // Keep only this cart's entries: a new cart starts fresh.
  const list = readJSON<string[]>(ls(), DECLINED_KEY, []).filter((k) => k.startsWith(`${cartId}|`) && k !== key);
  if (declined) list.push(key);
  writeJSON(ls(), DECLINED_KEY, list);
}

function markOnce(key: string): boolean {
  const seen = readJSON<string[]>(ss(), EVENTS_KEY, []);
  if (seen.includes(key)) return false;
  seen.push(key);
  writeJSON(ss(), EVENTS_KEY, seen.slice(-200));
  return true;
}

/** Cart → order attributes. Underscore keys are hidden at checkout. */
function buildAttributes(cart: CartView | null): Array<{ key: string; value: string }> {
  const out: Array<{ key: string; value: string }> = [];
  const add = (key: string, v: string | null | undefined) => {
    const value = (v ?? "").toString().slice(0, 250);
    if (value) out.push({ key, value });
  };
  try {
    const ft = readUtms();
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) add(`_sr_${k}`, ft[k]);
    const se = readSessionUtms();
    add("_sr_visit_campaign", se.utm_campaign);
    add("_sr_visit_term", se.utm_term);
    add("_sr_visit_content", se.utm_content);
    add("_sr_ad_visitor", isAdVisitor() ? "yes" : "");
    add("_sr_email_visitor", isEmailVisitor() ? "yes" : "");
    const phase = activeSale();
    const active = legacyOffersPaused() ? null : getActiveCode();
    if (phase) {
      add("_sr_deal", (cart?.discountCodes ?? []).filter((d) => d.applicable).map((d) => d.code).join("+"));
      add("_sr_deal_source", `sale-${saleChannel()}`);
      add("_sr_sale_phase", phase.id);
    }
    const applied = cart?.discountCodes.find((d) => d.applicable && active && d.code.toUpperCase() === active.toUpperCase());
    if (applied) {
      const entry = getWalletEntry(active);
      add("_sr_deal", applied.code);
      add("_sr_deal_source", entry?.source);
      add("_sr_box", entry?.box ? "1" : "");
    }
    // Mega Sale, for fulfillment's cross-check (validation v1 §3.2: inside
    // this one write, or checkout's attribute update would erase them).
    if (MEGA_SALE_ENABLED && cart) {
      add("_bf_mega_spend", (qualifyingCents(cart.lines) / 100).toFixed(2));
      add("_bf_mega_gifts", String(cart.lines.filter(isGiftLine).reduce((n, l) => n + l.quantity, 0)));
    }
    // Where the cart STARTED: set once at creation, kept afterwards (4.1i).
    add("_sr_capture_page", cart?.attributes._sr_capture_page || (typeof location !== "undefined" ? location.pathname : ""));
  } catch {
    /* attribution must never block the cart */
  }
  return out;
}

function snapshotLines(items: CartItem[]): NewLine[] {
  // Mega gifts are left out: reconcile re-adds the right number.
  return items
    .filter((i) => i.quantity > 0 && !isGiftLine(i))
    .map((i) => ({
      merchandiseId: i.variantId,
      quantity: i.quantity,
      ...(i.freeFor ? { attributes: [{ key: FREE_ATTR, value: i.freeFor }] } : {}),
    }));
}

const isTenOnly = (rule: Extract<DealRule, { kind: "bxgy" }>) =>
  rule.getScope.tiers.length === 1 && rule.getScope.tiers[0] === 10;

function pickFreeVariant(rule: Extract<DealRule, { kind: "bxgy" }>, items: CartItem[]): string | null {
  const lines = dealLines(items);
  if (isTenOnly(rule)) {
    const has = lines.find((l) => !l.freeFor && FREE_10MG.some((p) => p.variantId === l.variantId));
    return has?.variantId ?? FREE_10MG[0]?.variantId ?? null;
  }
  // "Any 4-pack": the cheapest paid pack in the cart — the one Shopify frees.
  return cheapestPaidLine(lines, rule.buyScope)?.variantId ?? null;
}

/** Highest price a free pack may have so it stays the one Shopify frees. */
export function freePriceCap(rule: DealRule | null, items: CartItem[]): number {
  if (!rule || rule.kind !== "bxgy") return Infinity;
  return cheapestPaidPrice(dealLines(items), rule.buyScope);
}

const flavorName = (variantId: string, fallback: string) => {
  const p = packByVariantId(variantId);
  return p ? `${p.flavor} ${p.tier}mg` : fallback;
};

function gaItems(items: Array<Pick<CartItem, "variantId" | "productTitle" | "variantTitle" | "price" | "quantity">>) {
  return items.map((i) => ({
    item_id: i.variantId,
    item_name: i.productTitle,
    item_variant: i.variantTitle,
    price: Number(i.price.amount),
    quantity: i.quantity,
  }));
}

function klaviyoCartProps(items: CartItem[], cart: CartView | null) {
  return {
    ItemNames: items.map((i) => i.productTitle),
    CheckoutURL: cart?.checkoutUrl ?? null,
    DiscountCode: appliedCodes(cart),
    Items: items.map((i) => ({
      ProductName: i.productTitle,
      VariantTitle: i.variantTitle,
      ProductID: i.productId ?? null,
      VariantID: i.variantId,
      ProductHandle: i.productHandle,
      Quantity: i.quantity,
      ItemPrice: Number(i.price.amount),
      RowTotal: i.lineTotal ?? Number((Number(i.price.amount) * i.quantity).toFixed(2)),
      ImageURL: i.imageUrl,
      Free: !!i.freeFor || isGiftLine(i),
    })),
  };
}

/** Applicable codes as one string ("SUNRISE30, SUNRISE60"), or null. */
function appliedCodes(cart: CartView | null): string | null {
  const c = (cart?.discountCodes ?? []).filter((d) => d.applicable).map((d) => d.code);
  return c.length ? c.join(", ") : null;
}

const cartValue = (items: Array<Pick<CartItem, "price" | "quantity">>) =>
  Number(items.reduce((s, i) => s + Number(i.price.amount) * i.quantity, 0).toFixed(2));

function emitDealEvents(cart: CartView | null, items: CartItem[], ev: DealEval, code: string | null) {
  if (!cart) return;
  if (code && ev.status === "progress") {
    const key = `progress|${cart.id}|${code}|${ev.have}`;
    if (markOnce(key)) {
      siteEvent(
        "Deal Progress",
        { code, label: dealByCode(code)?.label ?? "", have: ev.have, need: ev.need, message: ev.message },
        { value: cart.merchandiseAfterDiscounts, dedupeKey: `${cart.id}|${code}|${ev.have}` },
      );
    }
  }
  const applicable = !!code && cart.discountCodes.some((d) => d.applicable && d.code.toUpperCase() === code.toUpperCase());
  if (code && ev.status === "complete" && applicable && markOnce(`unlocked|${cart.id}|${code}`)) {
    siteEvent(
      "Deal Unlocked",
      { code, label: dealByCode(code)?.label ?? "", savings: cart.savings, ...klaviyoCartProps(items, cart) },
      { value: cart.merchandiseAfterDiscounts, dedupeKey: `${cart.id}|${code}` },
    );
  }
  if (freeShipState(cart.merchandiseAfterDiscounts).unlocked && markOnce(`freeship|${cart.id}`)) {
    siteEvent(
      "Reached Free Shipping",
      { cart_total: cart.merchandiseAfterDiscounts, ...klaviyoCartProps(items, cart) },
      { value: cart.merchandiseAfterDiscounts, dedupeKey: cart.id },
    );
  }
}

// ── the single-file queue ────────────────────────────────────────────────
let chain: Promise<unknown> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}
let syncedOnce = false; // first sync after load has run
let aliveThisVisit = false; // the saved cart was confirmed alive in this page session
let reconcileQueued = false;
let pendingWarnings: CartWarning[] = [];
const usageChecked = new Set<string>(); // cartId|code|email
const freeAddFailed = new Set<string>(); // cartId|code
let replaceForeign = false;
let usedCodeStop = false; // set when a used code was found during checkout prep
const megaLastEarned = new Map<string, number>(); // cartId → gifts earned at the last settle
const megaAddFailed = new Set<string>(); // cartId|earned: don't retry until reload or a new count

const timeout = (ms: number) => new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms));

// ── store ────────────────────────────────────────────────────────────────
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      const apply = (cart: CartView) => {
        aliveThisVisit = true;
        set({ cart, cartId: cart.id, checkoutUrl: cart.checkoutUrl, items: toItems(cart) });
      };

      const createCart = (lines: NewLine[]): Promise<CartResult> => {
        // Sale mode: codes go on in reconcile, which knows the lines' tiers.
        const active = legacyOffersPaused() ? null : getActiveCode();
        return cartCreateFull({
          lines,
          discountCodes: active ? [active] : [],
          email: knownEmail(),
          attributes: buildAttributes(null),
        });
      };

      /** Run one mutation. On "cart not found": rebuild from the browser's copy
       *  ONLY if this cart was alive during this visit (with the shopper's
       *  intended edit applied first); otherwise start from `extra` alone. */
      const mutate = async (
        fn: (cartId: string) => Promise<CartResult>,
        extra: NewLine[] = [],
        editSnapshot?: (items: CartItem[]) => CartItem[],
      ): Promise<CartResult | null> => {
        const { cartId, items } = get();
        let res: CartResult;
        if (!cartId) {
          if (!extra.length) return null;
          res = await createCart(extra);
        } else {
          res = await fn(cartId);
          if (!res.ok && res.notFound) {
            const base = aliveThisVisit ? snapshotLines(editSnapshot ? editSnapshot(items) : items) : [];
            set({ cart: null, cartId: null, checkoutUrl: null, items: [] });
            const lines = [...base, ...extra];
            if (!lines.length) return null;
            res = await createCart(lines);
          }
        }
        if (!res.ok) {
          console.error("Cart update failed:", res.errors);
          set({ error: "Something went wrong updating your cart. Please try again." });
          return res;
        }
        pendingWarnings.push(...res.warnings);
        apply(res.cart);
        return res;
      };

      /** Mega gift add / flavor change: one mutation with NO cart rebuild. A
       *  gift variant that's missing or drafted comes back as "merchandise …
       *  does not exist", which `mutate` would read as a lost cart and rebuild
       *  into a new one (verified Nov 27). Warnings are dropped: a gift that
       *  can't be added gets its own notice, not the low-stock one. */
      const giftMutate = async (fn: (cartId: string) => Promise<CartResult>): Promise<CartResult | null> => {
        const id = get().cartId;
        if (!id) return null;
        const res = await fn(id);
        if (res.ok) apply(res.cart);
        else console.warn("[mega] gift update failed:", res.errors);
        return res;
      };

      const doSync = async () => {
        const { cartId } = get();
        set({ isSyncing: true });
        try {
          if (!cartId) return;
          const cart = await fetchCart(cartId);
          if (!cart || cart.totalQuantity === 0) {
            // Completed or expired. If the shopper left for checkout with this
            // cart and a code within the last 2 h, the code was used: forget it.
            const pending = readJSON<{ cartId: string; code: string | null; at: number } | null>(ls(), PENDING_CHECKOUT_KEY, null);
            if (pending && pending.cartId === cartId && Date.now() - pending.at < FORGET_WINDOW_MS && pending.code) {
              forgetCode(pending.code);
            }
            if (pending && pending.cartId === cartId) writeJSON(ls(), PENDING_CHECKOUT_KEY, null);
            set({ items: [], cart: null, cartId: null, checkoutUrl: null });
          } else {
            apply(cart);
          }
        } catch (err) {
          console.error("Failed to sync cart:", err);
        } finally {
          syncedOnce = true;
          set({ isSyncing: false });
        }
      };
      const ensureSynced = async () => {
        if (!syncedOnce) await doSync();
      };

      /** Code + used-code + free-pack + chooser logic. Runs INSIDE the queue. */
      const reconcileInner = async () => {
        let converged = false;
        for (let pass = 0; pass < MAX_PASSES; pass++) {
          const { cart, items } = get();
          if (!cart || !items.length) {
            converged = true;
            break;
          }
          const phase = activeSale();
          const active = legacyOffersPaused() ? null : getActiveCode();
          const rule = dealByCode(active);

          // 0) Email on the cart as soon as we know it (prefill + used-code check).
          const email = knownEmail();
          if (email && cart.email !== email) {
            if (!(await mutate((id) => cartBuyerIdentityUpdateFull(id, email)))?.ok) break;
            continue;
          }

          // 1) Used code? Shopify said so in a warning on a mutation this pass.
          const warns = pendingWarnings;
          pendingWarnings = [];
          const used =
            !!active && warns.some((w) => w.code === USED_CODE_WARNING && w.message.toUpperCase().includes(active.toUpperCase()));
          if (used && active) {
            usedCodeStop = true;
            const ours = items.filter((i) => i.freeFor?.toUpperCase() === active.toUpperCase());
            forgetCode(
              active,
              `You've already used ${rule?.label ?? "this deal"} (code ${active}) on a past order, so it's been removed${ours.length ? " along with its free pack" : ""}.`,
            );
            if (ours.length && !(await mutate((id) => cartLinesRemoveFull(id, ours.map((o) => o.lineId as string))))?.ok) break;
            const stillOn = get().cart?.discountCodes.some((d) => d.code.toUpperCase() === active.toUpperCase());
            if (stillOn && !(await mutate((id) => cartDiscountCodesUpdateFull(id, [])))?.ok) break;
            continue;
          }
          if (warns.some((w) => STOCK_WARNINGS.includes(w.code))) {
            set({ error: "Some items are low on stock, so your cart was adjusted. Please check it." });
          }

          // 2) Code on the cart.
          const applied = cart.discountCodes.map((d) => d.code.toUpperCase());
          if (phase) {
            // Sale: exactly the channel's usable codes, both in one update.
            if (get().foreignCode) set({ foreignCode: null });
            const want = saleCodesFor(items, phase);
            if (!sameCodes(applied, want)) {
              if (!(await mutate((id) => cartDiscountCodesUpdateFull(id, want)))?.ok) break;
              continue;
            }
          }
          const foreign = phase ? null : applied.find((c) => !dealByCode(c)) ?? null;
          if (phase) {
            /* handled above */
          } else if (foreign && !replaceForeign) {
            if (get().foreignCode !== foreign) set({ foreignCode: foreign });
          } else {
            if (get().foreignCode) set({ foreignCode: null });
            const want = active ? active.toUpperCase() : null;
            const codeOk = want ? applied.length === 1 && applied[0] === want : applied.every((c) => !dealByCode(c));
            if (!codeOk) {
              replaceForeign = false;
              if (!(await mutate((id) => cartDiscountCodesUpdateFull(id, want ? [active as string] : [])))?.ok) break;
              continue;
            }
          }

          // 2b) BLACK FRIDAY MEGA SALE gifts (lib/megaSale.ts). Runs after the
          //     codes, so line totals are Shopify's discounted ones.
          const gifts = items.filter(isGiftLine);
          if (MEGA_SALE_ENABLED || gifts.length) {
            if (!MEGA_SALE_ENABLED) {
              pushNotice(MEGA_COPY.ended);
              if (!(await mutate((id) => cartLinesRemoveFull(id, gifts.map((g) => g.lineId as string))))?.ok) break;
              continue;
            }
            const earned = earnedGifts(items);
            const slotOf = (g: CartItem) => {
              const n = g.giftTag === GIFT_VALUE ? Number(g.giftSlot) : NaN;
              return Number.isInteger(n) && n > 0 ? n : Infinity;
            };
            // Keep the lowest slots; unslotted lines (added outside the site) last.
            const ranked = [...gifts].sort((a, b) => slotOf(a) - slotOf(b));
            const keep = ranked.slice(0, earned);
            const extra = ranked.slice(earned);
            if (extra.length) {
              const prev = megaLastEarned.get(cart.id);
              // Notice only when spend really fell under a $100 step; duplicate
              // or outside-the-site extras come out silently.
              if (prev !== undefined && earned < prev) pushNotice(MEGA_COPY.dropped(earned + 1));
              megaLastEarned.set(cart.id, earned);
              if (!(await mutate((id) => cartLinesRemoveFull(id, extra.map((g) => g.lineId as string))))?.ok) break;
              continue;
            }
            // Drift: quantity 1, our tag, and a unique slot on every kept gift.
            const used = new Set<number>();
            const needSlot: CartItem[] = [];
            keep.forEach((g) => {
              const n = slotOf(g);
              if (n !== Infinity && !used.has(n)) used.add(n);
              else needSlot.push(g);
            });
            const nextSlot = () => {
              let n = 1;
              while (used.has(n)) n++;
              used.add(n);
              return n;
            };
            const fixes = keep
              .filter((g) => g.quantity !== 1 || needSlot.includes(g))
              .map((g) => ({
                id: g.lineId as string,
                quantity: 1,
                attributes: [
                  { key: GIFT_ATTR, value: GIFT_VALUE },
                  { key: GIFT_SLOT_ATTR, value: String(needSlot.includes(g) ? nextSlot() : slotOf(g)) },
                ],
              }));
            if (fixes.length) {
              if (!(await mutate((id) => cartLinesUpdateFull(id, fixes)))?.ok) break;
              continue;
            }
            // Too few: add the missing slots in ONE call, cart's top flavor.
            const failKey = `${cart.id}|${earned}`;
            if (keep.length < earned && !megaAddFailed.has(failKey)) {
              const gift = defaultGift(items);
              const add: NewLine[] = Array.from({ length: earned - keep.length }, () => ({
                merchandiseId: gift.variantId,
                quantity: 1,
                attributes: [
                  { key: GIFT_ATTR, value: GIFT_VALUE },
                  { key: GIFT_SLOT_ATTR, value: String(nextSlot()) },
                ],
              }));
              const res = await giftMutate((id) => cartLinesAddFull(id, add));
              const have = get().items.filter((i) => isGiftLine(i) && i.giftTag === GIFT_VALUE).length;
              if (!res?.ok || have < earned) {
                // Fail safe: one notice, no retry loop, the paid cart still works.
                megaAddFailed.add(failKey);
                pushNotice(MEGA_COPY.failed);
                megaLastEarned.set(cart.id, earned);
                converged = true;
                break;
              }
              if (!readJSON<boolean>(ss(), MEGA_TOAST_KEY, false)) {
                writeJSON(ss(), MEGA_TOAST_KEY, true);
                set({ megaToast: MEGA_COPY.toast(gift.label) });
              }
              continue;
            }
            megaLastEarned.set(cart.id, earned);
          }

          // 3) Once per cart/code/email, ask Shopify directly (covers reloads,
          //    where no mutation has returned warnings yet).
          if (active && email && cart.email === email && applied.includes(active.toUpperCase())) {
            const key = `${cart.id}|${active}|${email}`;
            if (!usageChecked.has(key)) {
              usageChecked.add(key);
              if (!(await mutate((id) => cartDiscountCodesUpdateFull(id, [active])))?.ok) break;
              continue;
            }
          }

          // 4) Free lines from a deal that's no longer active go (with a notice).
          const stale = items.filter((i) => i.freeFor && i.freeFor.toUpperCase() !== (active ?? "").toUpperCase());
          if (stale.length) {
            pushNotice("We took out the free pack from your previous deal.");
            if (!(await mutate((id) => cartLinesRemoveFull(id, stale.map((s) => s.lineId as string))))?.ok) break;
            continue;
          }

          // 5) Singles-only cart while a non-free-can deal is active and a free
          //    can is saved: ASK (free can pre-selected), never switch.
          if (rule && rule.kind !== "freeCan" && !getChoice()) {
            const onlySingles = items.every((i) => packOf(i.variantTitle) === "single");
            const fc = listWallet().find((e) => dealByCode(e.code)?.kind === "freeCan");
            const asked = readJSON<string[]>(ss(), SINGLES_ASKED_KEY, []);
            if (onlySingles && fc && !asked.includes(cart.id)) {
              writeJSON(ss(), SINGLES_ASKED_KEY, [...asked, cart.id]);
              askChoice([rule.code, fc.code], fc.code, "singles-cart");
            }
          }

          // 6) Free pack for buy-X-get-Y.
          if (rule?.kind === "bxgy") {
            const lines = dealLines(items);
            const ours = items.filter((i) => i.freeFor?.toUpperCase() === rule.code.toUpperCase());
            // Never more than the deal gives.
            const oursQty = ours.reduce((n, o) => n + o.quantity, 0);
            if (oursQty > rule.get) {
              const [first, ...rest] = ours;
              if (rest.length) {
                if (!(await mutate((id) => cartLinesRemoveFull(id, rest.map((r) => r.lineId as string))))?.ok) break;
              } else if (!(await mutate((id) => cartLinesUpdateFull(id, [{ id: first.lineId as string, quantity: rule.get }])))?.ok) {
                break;
              }
              continue;
            }
            const ev = evaluateDeal(rule, lines, isFreeDeclined(cart.id, rule.code));
            if (ev.removeFreeLineId) {
              if (ev.removeReason === "paid-covers") {
                pushNotice("You already have enough 4-packs for your free one, so we took out the extra pack we'd added.");
              }
              const lineId = ev.removeFreeLineId;
              if (!(await mutate((id) => cartLinesRemoveFull(id, [lineId])))?.ok) break;
              continue;
            }
            // Free pack priced ABOVE the cheapest paid pack → Shopify would
            // charge it: switch to the cheapest paid flavor, and say so.
            const cap = cheapestPaidPrice(lines, rule.buyScope);
            const pricey = ours.find((o) => Number(o.price.amount) > cap + 0.001);
            if (pricey && !isTenOnly(rule)) {
              const target = cheapestPaidLine(lines, rule.buyScope);
              if (target) {
                pushNotice(
                  `Your free 4-pack is now ${flavorName(target.variantId, "the lowest-priced pack")}: the lowest-priced 4-pack in your cart is always the free one.`,
                );
                const res = await mutate((id) =>
                  cartLinesUpdateFull(id, [
                    {
                      id: pricey.lineId as string,
                      quantity: pricey.quantity,
                      merchandiseId: target.variantId,
                      attributes: [{ key: FREE_ATTR, value: rule.code }],
                    },
                  ]),
                );
                if (!res?.ok) break;
                continue;
              }
            }
            const failKey = `${cart.id}|${rule.code}`;
            if (ev.addFree && !freeAddFailed.has(failKey)) {
              const variantId = pickFreeVariant(rule, items);
              if (!variantId) {
                converged = true;
                break;
              }
              const line: NewLine = { merchandiseId: variantId, quantity: rule.get, attributes: [{ key: FREE_ATTR, value: rule.code }] };
              const res = await mutate((id) => cartLinesAddFull(id, [line]), [line]);
              const added = !!res?.ok && get().items.some((i) => i.freeFor?.toUpperCase() === rule.code.toUpperCase());
              if (!added) {
                freeAddFailed.add(failKey);
                pushNotice("We couldn't add your free 4-pack right now (it may be out of stock). Please try another flavor.");
                converged = true;
                break;
              }
              continue;
            }
          }
          converged = true;
          break;
        }
        if (!converged) set({ error: "We couldn't finish updating your deal. Please refresh the page." });
        const { cart, items } = get();
        // Sale health check: a sale code on the cart that Shopify won't honour
        // while its drinks are in the cart (codes not set to combine, wrong
        // product scope, or not active yet). Logged once per cart and code so
        // it shows up in Klaviyo/console the first time it happens.
        const salePhase = activeSale();
        if (salePhase && cart) {
          const want = saleCodesFor(items, salePhase).map((c) => c.toUpperCase());
          const bad = cart.discountCodes.filter((d) => !d.applicable && want.includes(d.code.toUpperCase()));
          for (const b of bad) {
            if (markOnce(`salebad|${cart.id}|${b.code}`)) {
              console.warn(`[sale] Shopify did not apply ${b.code}`);
              siteEvent("Sale Code Not Applied", { code: b.code, phase: salePhase.id, channel: saleChannel() });
            }
          }
        }
        const code = salePhase ? null : getActiveCode();
        emitDealEvents(cart, items, evaluateDeal(dealByCode(code), dealLines(items), isFreeDeclined(cart?.id ?? null, code)), code);
      };

      const fireAdded = (added: Array<Pick<CartItem, "variantId" | "productTitle" | "variantTitle" | "price" | "quantity">>) => {
        const { items, cart } = get();
        // One GA4 push and ONE Klaviyo event per add action (a box = one add).
        trackEcommerce("add_to_cart", {
          currency: added[0]?.price.currencyCode ?? "USD",
          value: cartValue(added),
          items: gaItems(added),
          content_ids: added.map((a) => a.variantId),
        });
        const first = added[0];
        const line = items.find((i) => i.variantId === first.variantId && !i.freeFor);
        siteEvent(
          "Added to Cart",
          {
            AddedItemProductName: line?.productTitle ?? first.productTitle,
            AddedItemVariant: line?.variantTitle ?? first.variantTitle,
            AddedItemProductID: line?.productId ?? null,
            AddedItemVariantID: first.variantId,
            AddedItemPrice: Number(first.price.amount),
            AddedItemQuantity: added.reduce((n, a) => n + a.quantity, 0),
            AddedItemImageURL: line?.imageUrl ?? null,
            AddedItemURL: typeof location !== "undefined" ? location.origin + location.pathname : null,
            AddedItems: added.map((a) => {
              const l = items.find((i) => i.variantId === a.variantId && !i.freeFor);
              return { ProductName: l?.productTitle ?? a.productTitle, VariantID: a.variantId, ProductID: l?.productId ?? null, Quantity: a.quantity };
            }),
            ...klaviyoCartProps(items, cart),
          },
          { value: cartValue(items) },
        );
      };

      const fireRemoved = (before: CartItem, qty: number) => {
        const removed = { ...before, quantity: qty };
        trackEcommerce("remove_from_cart", { currency: before.price.currencyCode, value: cartValue([removed]), items: gaItems([removed]) });
        siteEvent(
          "Removed from Cart",
          {
            RemovedItemProductName: before.productTitle,
            RemovedItemVariant: before.variantTitle,
            RemovedItemProductID: before.productId ?? null,
            RemovedItemQuantity: qty,
            WasFree: !!before.freeFor,
            ...klaviyoCartProps(get().items, get().cart),
          },
          { value: cartValue(get().items) },
        );
      };

      return {
        items: [],
        cart: null,
        cartId: null,
        checkoutUrl: null,
        isOpen: false,
        isLoading: false,
        isSyncing: false,
        isCheckingOut: false,
        error: null,
        foreignCode: null,
        megaToast: null,
        dismissMegaToast: () => set({ megaToast: null }),

        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),

        addItem: (item, opts) => get().addItems([item], opts),

        addItems: async (list, opts = {}) => {
          const add = list.filter((i) => i.quantity > 0);
          if (!add.length) return false;
          clearMegaDropNotices();
          set({ isLoading: true, error: null });
          if (opts.open !== false) set({ isOpen: true });
          try {
            return await enqueue(async () => {
              await ensureSynced();
              const lines: NewLine[] = add.map((i) => ({
                merchandiseId: i.variantId,
                quantity: i.quantity,
                ...(i.freeFor ? { attributes: [{ key: FREE_ATTR, value: i.freeFor }] } : {}),
              }));
              // Units per variant + free tag, before and after (a paid and a
              // free line of the same flavor are separate lines).
              const unitsBy = (list: Array<{ variantId: string; freeFor?: string | null; quantity: number }>) => {
                const m = new Map<string, number>();
                list.forEach((i) => {
                  const k = `${i.variantId}|${i.freeFor ? 1 : 0}`;
                  m.set(k, (m.get(k) ?? 0) + i.quantity);
                });
                return m;
              };
              const before = unitsBy(get().items);
              const res = await mutate((id) => cartLinesAddFull(id, lines), lines);
              if (!res?.ok) return false;
              // Out of stock: Shopify adds less (or nothing) and warns.
              const after = unitsBy(get().items);
              const short = add.filter((a) => {
                const k = `${a.variantId}|${a.freeFor ? 1 : 0}`;
                return (after.get(k) ?? 0) - (before.get(k) ?? 0) < a.quantity;
              });
              if (short.length) {
                set({ error: `Sorry, ${short.map((s) => s.productTitle).join(", ")} is low on stock. Your cart shows what we could add.` });
              }
              const landed = add.filter((a) => !short.includes(a));
              if (landed.length) fireAdded(landed);
              await reconcileInner();
              return short.length === 0;
            });
          } catch (err) {
            console.error("Failed to add item:", err);
            set({ error: "Couldn't add that. Please try again." });
            return false;
          } finally {
            set({ isLoading: false });
          }
        },

        updateQuantity: async (lineId, quantity) => {
          if (quantity <= 0) return get().removeItem(lineId);
          clearMegaDropNotices();
          set({ isLoading: true, error: null });
          try {
            await enqueue(async () => {
              await ensureSynced();
              const before = get().items.find((i) => i.lineId === lineId);
              if (!before) return;
              const edit = (items: CartItem[]) => items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i));
              const res = await mutate((id) => cartLinesUpdateFull(id, [{ id: lineId, quantity }]), [], edit);
              if (!res?.ok) return;
              if (quantity < before.quantity) fireRemoved(before, before.quantity - quantity);
              if (quantity > before.quantity) fireAdded([{ ...before, quantity: quantity - before.quantity }]);
              await reconcileInner();
            });
          } finally {
            set({ isLoading: false });
          }
        },

        removeItem: async (lineId) => {
          clearMegaDropNotices();
          set({ isLoading: true, error: null });
          try {
            await enqueue(async () => {
              await ensureSynced();
              const before = get().items.find((i) => i.lineId === lineId);
              if (!before) return;
              const cartId = get().cartId;
              if (before.freeFor && cartId) setFreeDeclined(cartId, before.freeFor, true);
              const edit = (items: CartItem[]) => items.filter((i) => i.lineId !== lineId);
              const res = await mutate((id) => cartLinesRemoveFull(id, [lineId]), [], edit);
              if (!res?.ok) return;
              fireRemoved(before, before.quantity);
              if (get().items.length === 0) set({ items: [], cart: null, cartId: null, checkoutUrl: null });
              else await reconcileInner();
            });
          } finally {
            set({ isLoading: false });
          }
        },

        swapFreeItem: async (lineId, variantId) => {
          set({ isLoading: true });
          try {
            await enqueue(async () => {
              const line = get().items.find((i) => i.lineId === lineId);
              if (!line?.freeFor || line.variantId === variantId) return;
              const rule = dealByCode(line.freeFor);
              const target = packByVariantId(variantId);
              // Only flavors Shopify will actually free (≤ cheapest paid pack).
              if (target && target.fallbackPrice > freePriceCap(rule, get().items) + 0.001) return;
              await mutate((id) =>
                cartLinesUpdateFull(id, [
                  { id: lineId, quantity: line.quantity, merchandiseId: variantId, attributes: [{ key: FREE_ATTR, value: line.freeFor as string }] },
                ]),
              );
              await reconcileInner();
            });
          } finally {
            set({ isLoading: false });
          }
        },

        changeGiftFlavor: async (lineId, variantId) => {
          const target = giftByVariant(variantId);
          if (!target) return;
          set({ isLoading: true });
          try {
            await enqueue(async () => {
              const line = get().items.find((i) => i.lineId === lineId);
              if (!line || !isGiftLine(line) || line.variantId === variantId) return;
              // Same line, both attributes kept. No analytics (not an add/remove).
              const res = await giftMutate((id) =>
                cartLinesUpdateFull(id, [
                  {
                    id: lineId,
                    quantity: 1,
                    merchandiseId: variantId,
                    attributes: [
                      { key: GIFT_ATTR, value: GIFT_VALUE },
                      { key: GIFT_SLOT_ATTR, value: line.giftSlot || "1" },
                    ],
                  },
                ]),
              );
              if (!res?.ok) pushNotice("We couldn't change your free 4-pack's flavor right now. Please try again.");
              if (get().megaToast) set({ megaToast: null });
              await reconcileInner();
            });
          } finally {
            set({ isLoading: false });
          }
        },

        restoreFreeItem: async () => {
          set({ isLoading: true });
          try {
            await enqueue(async () => {
              const code = getActiveCode();
              const cartId = get().cartId;
              if (!code || !cartId) return;
              setFreeDeclined(cartId, code, false);
              freeAddFailed.delete(`${cartId}|${code}`);
              await reconcileInner();
            });
          } finally {
            set({ isLoading: false });
          }
        },

        useSavedDeal: async () => {
          replaceForeign = true;
          await get().reconcile();
        },

        reconcile: async () => {
          if (reconcileQueued) return;
          reconcileQueued = true;
          await enqueue(async () => {
            reconcileQueued = false;
            await ensureSynced();
            await reconcileInner();
          });
        },

        checkout: async (details) => {
          if (get().isCheckingOut) return;
          if (!get().cartId) {
            set({ error: "Your cart is empty or expired. Please add your items again." });
            return;
          }
          set({ isCheckingOut: true, error: null });
          if (details?.email) setIdentityEmail(details.email);
          usedCodeStop = false;
          const prep = enqueue(async () => {
            await ensureSynced();
            if (!get().cart) throw new Error("no cart");
            await reconcileInner(); // email on the cart, used-code check, code, free pack
            if (usedCodeStop) return "stop" as const;
            await mutate((id) => cartAttributesUpdateFull(id, buildAttributes(get().cart)));
            return "go" as const;
          });
          let r: "go" | "stop" | "timeout";
          try {
            r = await Promise.race([prep, timeout(CHECKOUT_TIMEOUT_MS)]);
          } catch {
            set({ isCheckingOut: false, error: "We couldn't open checkout. Please try again." });
            return;
          }
          if (r === "timeout") {
            set({ isCheckingOut: false, error: "Checkout is taking longer than usual. Please try again." });
            return;
          }
          if (r === "stop") {
            // A used code was removed: show the cart with the notice first.
            set({ isCheckingOut: false, isOpen: true });
            return;
          }
          const { items, cart } = get();
          const url = cart?.checkoutUrl;
          if (!cart || !url) {
            set({ isCheckingOut: false, error: "We couldn't open checkout. Please try again." });
            return;
          }
          const value = cart.merchandiseAfterDiscounts;
          const applied = appliedCodes(cart) ?? undefined;
          trackEcommerce("begin_checkout", {
            currency: cart.currency,
            value,
            num_items: items.reduce((n, i) => n + i.quantity, 0),
            items: gaItems(items),
            content_ids: items.map((i) => i.variantId),
            coupon: applied,
          });
          siteEvent("Started Checkout", { ...klaviyoCartProps(items, cart), Savings: cart.savings }, { value, sync: true });
          // Sale codes are unlimited-use: nothing to forget after the order.
          const walletCode = legacyOffersPaused() ? null : cart.discountCodes.find((d) => d.applicable)?.code ?? null;
          writeJSON(ls(), PENDING_CHECKOUT_KEY, { cartId: cart.id, code: walletCode, at: Date.now() });
          window.location.assign(url);
        },

        clearCart: () => set({ items: [], cart: null, cartId: null, checkoutUrl: null }),
        getCheckoutUrl: () => get().checkoutUrl,

        syncCart: async () => {
          set({ isCheckingOut: false });
          await enqueue(async () => {
            await doSync();
            await reconcileInner();
          });
        },
      };
    },
    {
      name: "shopify-cart",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cart: state.cart,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
      // v1 → v2: items had no lineTotal/freeFor; the first sync refreshes
      // everything from Shopify, so just carry the ids over.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<{ items: CartItem[]; cartId: string | null; checkoutUrl: string | null }>;
        return { items: p.items ?? [], cart: null, cartId: p.cartId ?? null, checkoutUrl: p.checkoutUrl ?? null } as never;
      },
    },
  ),
);

if (typeof window !== "undefined") {
  // Wallet changed (new claim, link, or a choice in the cart) → re-apply.
  window.addEventListener(WALLET_EVENT, () => {
    useCartStore.getState().reconcile();
  });
  // Sale channel changed (email link) → swap to that channel's code pair.
  window.addEventListener(SALE_EVENT, () => {
    useCartStore.getState().reconcile();
  });
  // Shopper identified → their email goes on the cart (prefill + used-code check).
  subscribeIdentity(() => {
    useCartStore.getState().reconcile();
  });
  // Back from Shopify checkout via the back/forward cache: un-freeze + refresh.
  window.addEventListener("pageshow", (e) => {
    if ((e as PageTransitionEvent).persisted) useCartStore.getState().syncCart();
  });
  // Another tab changed the cart: pick it up. Only for a REAL change (fix
  // Oct 29): Shopify returns a new checkout-link key on every cart read, so
  // comparing raw values made two open tabs re-sync each other ~4×/second
  // forever. Lines, quantities, codes and email are what matter.
  const cartSig = (raw: string | null) => {
    try {
      const st = (JSON.parse(raw ?? "null") as { state?: { cartId?: string | null; cart?: CartView | null } } | null)?.state;
      if (!st) return "";
      const c = st.cart;
      return JSON.stringify([
        st.cartId ?? null,
        c?.email ?? null,
        c?.discountCodes ?? [],
        (c?.lines ?? []).map((l) => [l.lineId, l.variantId, l.quantity, l.attributes]),
      ]);
    } catch {
      return raw ?? "";
    }
  };
  window.addEventListener("storage", (e) => {
    if (e.key === "shopify-cart" && cartSig(e.oldValue) !== cartSig(e.newValue)) {
      Promise.resolve(useCartStore.persist.rehydrate()).then(() => useCartStore.getState().syncCart());
    }
  });
}
