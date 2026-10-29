// CART STORE — site pass 1 (Oct 28 2026).
//
// What changed vs. the previous store:
//   1. Shopify's cart is the source of truth. Every mutation returns the full
//      cart (lib/shopify.ts CART_FIELDS) and the store renders Shopify's own
//      line totals, applied code and savings.
//   2. Claimed codes apply themselves (lib/dealWallet.ts active code →
//      cartDiscountCodesUpdate). One code at a time: Shopify codes here never
//      combine.
//   3. Buy-X-get-Y codes: once the "buy" side is in the cart, the free item is
//      added for the shopper (line attribute `_sr_free` = code) and removed
//      again if the cart drops below the requirement. If the shopper removes
//      it, it is not re-added this session ("declined"); the cart offers it.
//   4. Expired cart: the tapped item is no longer lost. A fresh cart is created
//      with the old items + the new one (+ code, email, attributes).
//   5. Cart attributes (first-touch UTMs, current-visit campaign/term, active
//      code) ride on the cart → order. Underscore keys stay hidden at checkout.
//   6. Drawer open state lives here so Add to Cart can open it.
//   7. checkout(): buyer email set on the cart (Shopify prefills it), Started
//      Checkout event, SAME-TAB redirect (was a new tab).
//   8. Events: Added to Cart / Removed from Cart / Started Checkout (GA4 pushes
//      unchanged in shape) + Klaviyo; Deal Progress / Deal Unlocked / Reached
//      Free Shipping.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { track } from "@/lib/track";
import { siteEvent } from "@/lib/siteEvents";
import { knownEmail, getIdentity, setIdentityEmail } from "@/lib/identity";
import { readUtms, readSessionUtms, isAdVisitor, isEmailVisitor } from "@/lib/utms";
import { getActiveCode, listWallet } from "@/lib/dealWallet";
import { dealByCode, evaluateDeal, freeShipState, type DealEval, type DealLine, type DealRule } from "@/lib/deals";
import { FREE_10MG } from "@/lib/liveFourPacks";
import {
  cartAttributesUpdateFull,
  cartBuyerIdentityUpdateFull,
  cartCreateFull,
  cartDeliveryNamesAdd,
  cartDiscountCodesUpdateFull,
  cartLinesAddFull,
  cartLinesRemoveFull,
  cartLinesUpdateFull,
  fetchCart,
  type CartResult,
  type CartView,
  type NewLine,
} from "@/lib/shopify";

/** OFF until the names-prefill test passes (see cartDeliveryNamesAdd). */
const PREFILL_NAMES_AT_CHECKOUT = false;

const FREE_ATTR = "_sr_free";
const DECLINED_KEY = "sunrise:free-declined";
const EVENTS_KEY = "sunrise:cart-events";

export interface CartItem {
  lineId: string | null;
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string | null;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
  /** Shopify line total after discounts (0 for a fully free line). */
  lineTotal?: number;
  lineDiscount?: number;
  /** Code this line was auto-added for, else null. */
  freeFor?: string | null;
}

export type AddInput = Omit<CartItem, "lineId" | "lineTotal" | "lineDiscount" | "freeFor">;
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
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddInput, opts?: AddOpts) => Promise<void>;
  /** Several items in one call (Build Your Box). */
  addItems: (items: AddInput[], opts?: AddOpts) => Promise<boolean>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  /** Free-item picker: swap the auto-added free line to another flavor. */
  swapFreeItem: (lineId: string, variantId: string) => Promise<void>;
  /** Re-offer the free item after the shopper removed it. */
  restoreFreeItem: () => Promise<void>;
  /** Re-run code/free-item logic (e.g. after the wallet changes). */
  reconcile: () => Promise<void>;
  checkout: (details?: { email?: string; firstName?: string; lastName?: string }) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

// ── helpers ─────────────────────────────────────────────────────────────
function toItems(cart: CartView | null): CartItem[] {
  if (!cart) return [];
  return cart.lines.map((l) => ({
    lineId: l.lineId,
    variantId: l.variantId,
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

function readList(key: string): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeList(key: string, list: string[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(list.slice(-50)));
  } catch {
    /* private mode */
  }
}
export function isFreeDeclined(code: string | null): boolean {
  return !!code && readList(DECLINED_KEY).includes(code.toUpperCase());
}
function setFreeDeclined(code: string, declined: boolean) {
  const list = readList(DECLINED_KEY).filter((c) => c !== code.toUpperCase());
  if (declined) list.push(code.toUpperCase());
  writeList(DECLINED_KEY, list);
}

/** Cart → order attributes. Underscore keys are hidden at checkout. */
function buildAttributes(): Array<{ key: string; value: string }> {
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
    const active = getActiveCode();
    add("_sr_deal", active);
    add("_sr_deal_source", listWallet().find((e) => e.code === active)?.source);
    add("_sr_capture_page", typeof location !== "undefined" ? location.pathname : "");
  } catch {
    /* attribution must never block the cart */
  }
  return out;
}

function snapshotLines(items: CartItem[]): NewLine[] {
  return items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      merchandiseId: i.variantId,
      quantity: i.quantity,
      ...(i.freeFor ? { attributes: [{ key: FREE_ATTR, value: i.freeFor }] } : {}),
    }));
}

function createCart(lines: NewLine[]): Promise<CartResult> {
  const active = getActiveCode();
  return cartCreateFull({
    lines,
    discountCodes: active ? [active] : [],
    email: knownEmail(),
    attributes: buildAttributes(),
  });
}

function pickFreeVariant(rule: Extract<DealRule, { kind: "bxgy" }>, items: CartItem[]): string | null {
  const lines = dealLines(items).filter((l) => !l.freeFor);
  const only10 = rule.getScope.tiers.length === 1 && rule.getScope.tiers[0] === 10;
  if (only10) {
    const has = lines.find((l) => FREE_10MG.some((p) => p.variantId === l.variantId));
    return has?.variantId ?? FREE_10MG[0]?.variantId ?? null;
  }
  // "Any 4-pack": the cheapest eligible pack already in the cart — the one
  // Shopify will make free anyway, so the shopper sees exactly what they get.
  const elig = lines
    .filter((l) => /4\s*-?\s*pack/i.test(l.variantTitle) && rule.buyScope.tiers.some((t) => l.handle.startsWith(`${t}mg-`)))
    .sort((a, b) => a.unitPrice - b.unitPrice);
  return elig[0]?.variantId ?? null;
}

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
    DiscountCode: cart?.discountCodes.find((d) => d.applicable)?.code ?? null,
    Items: items.map((i) => ({
      ProductName: i.productTitle,
      VariantTitle: i.variantTitle,
      ProductID: i.variantId,
      ProductHandle: i.productHandle,
      Quantity: i.quantity,
      ItemPrice: Number(i.price.amount),
      RowTotal: i.lineTotal ?? Number((Number(i.price.amount) * i.quantity).toFixed(2)),
      ImageURL: i.imageUrl,
      Free: !!i.freeFor,
    })),
  };
}

function cartValue(items: CartItem[]) {
  return Number(items.reduce((s, i) => s + Number(i.price.amount) * i.quantity, 0).toFixed(2));
}

// Deal / free-ship transition events (once per state change; unlocks once per
// session per code / per cart).
let lastProgressKey = "";
function emitDealEvents(cart: CartView | null, items: CartItem[], ev: DealEval, code: string | null) {
  if (!cart) return;
  const seen = readList(EVENTS_KEY);
  const mark = (k: string) => {
    if (seen.includes(k)) return false;
    seen.push(k);
    writeList(EVENTS_KEY, seen);
    return true;
  };
  if (code && ev.status === "progress") {
    const key = `${code}|${ev.have}|${ev.need}`;
    if (key !== lastProgressKey) {
      lastProgressKey = key;
      siteEvent("Deal Progress", { code, have: ev.have, need: ev.need, message: ev.message }, { value: cart.merchandiseAfterDiscounts });
    }
  }
  if (code && ev.status === "complete" && mark(`unlocked|${code}|${cart.id}`)) {
    siteEvent(
      "Deal Unlocked",
      { code, label: dealByCode(code)?.label ?? "", savings: cart.savings, ...klaviyoCartProps(items, cart) },
      { value: cart.merchandiseAfterDiscounts },
    );
  }
  if (freeShipState(cart.merchandiseAfterDiscounts).unlocked && mark(`freeship|${cart.id}`)) {
    siteEvent("Reached Free Shipping", { cart_total: cart.merchandiseAfterDiscounts, ...klaviyoCartProps(items, cart) }, { value: cart.merchandiseAfterDiscounts });
  }
}

let reconciling = false;

// ── store ───────────────────────────────────────────────────────────────
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => {
      const apply = (cart: CartView) =>
        set({ cart, cartId: cart.id, checkoutUrl: cart.checkoutUrl, items: toItems(cart), error: null });

      /** Run a mutation against the current cart; on "cart not found" rebuild
       *  the cart from the last snapshot + `extra` lines. */
      const mutate = async (fn: (cartId: string) => Promise<CartResult>, extra: NewLine[] = []): Promise<boolean> => {
        const { cartId, items } = get();
        let res: CartResult = cartId ? await fn(cartId) : await createCart(extra);
        if (!res.ok && res.notFound) {
          // Expired / completed cart: start fresh with everything the shopper had.
          res = await createCart([...snapshotLines(items), ...extra]);
        }
        if (!res.ok) {
          console.error("Cart update failed:", res.errors);
          set({ error: "Something went wrong updating your cart. Please try again." });
          return false;
        }
        apply(res.cart);
        return true;
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

        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),

        addItem: async (item, opts) => {
          await get().addItems([item], opts);
        },

        addItems: async (list, opts = {}) => {
          const add = list.filter((i) => i.quantity > 0);
          if (!add.length) return false;
          const lines: NewLine[] = add.map((i) => ({ merchandiseId: i.variantId, quantity: i.quantity }));
          set({ isLoading: true });
          // Opening right away (with the loading state) makes the tap feel instant.
          if (opts.open !== false) set({ isOpen: true });
          try {
            const ok = await mutate((id) => cartLinesAddFull(id, lines), lines);
            if (!ok) return false;
            const { items, cart } = get();
            add.forEach((item) => {
              track("add_to_cart", {
                currency: item.price.currencyCode,
                value: Number((Number(item.price.amount) * item.quantity).toFixed(2)),
                items: gaItems([item]),
                content_id: item.variantId,
                content_name: item.productTitle,
              });
              siteEvent(
                "Added to Cart",
                {
                  AddedItemProductName: item.productTitle,
                  AddedItemVariant: item.variantTitle,
                  AddedItemProductID: item.variantId,
                  AddedItemPrice: Number(item.price.amount),
                  AddedItemQuantity: item.quantity,
                  AddedItemImageURL: item.imageUrl,
                  AddedItemURL: typeof location !== "undefined" ? location.origin + location.pathname : null,
                  ...klaviyoCartProps(items, cart),
                },
                { dl: false, value: cartValue(items) },
              );
            });
            await get().reconcile();
            return true;
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
          const before = get().items.find((i) => i.lineId === lineId);
          if (!before) return;
          set({ isLoading: true });
          try {
            const ok = await mutate((id) => cartLinesUpdateFull(id, [{ id: lineId, quantity }]));
            if (ok && quantity < before.quantity) {
              const removed = { ...before, quantity: before.quantity - quantity };
              track("remove_from_cart", { currency: before.price.currencyCode, value: cartValue([removed]), items: gaItems([removed]) });
              siteEvent("Removed from Cart", { RemovedItemProductName: before.productTitle, RemovedItemVariant: before.variantTitle, RemovedItemQuantity: removed.quantity, ...klaviyoCartProps(get().items, get().cart) }, { dl: false, value: cartValue(get().items) });
            }
            if (ok && quantity > before.quantity) {
              // "+" in the cart is an add too (GA4 + Klaviyo), same shape as addItems.
              const added = { ...before, quantity: quantity - before.quantity };
              track("add_to_cart", { currency: before.price.currencyCode, value: cartValue([added]), items: gaItems([added]), content_id: before.variantId, content_name: before.productTitle });
              siteEvent(
                "Added to Cart",
                {
                  AddedItemProductName: before.productTitle,
                  AddedItemVariant: before.variantTitle,
                  AddedItemProductID: before.variantId,
                  AddedItemPrice: Number(before.price.amount),
                  AddedItemQuantity: added.quantity,
                  AddedItemImageURL: before.imageUrl,
                  AddedItemURL: typeof location !== "undefined" ? location.origin + location.pathname : null,
                  ...klaviyoCartProps(get().items, get().cart),
                },
                { dl: false, value: cartValue(get().items) },
              );
            }
            if (ok) await get().reconcile();
          } catch (err) {
            console.error("Failed to update quantity:", err);
          } finally {
            set({ isLoading: false });
          }
        },

        removeItem: async (lineId) => {
          const before = get().items.find((i) => i.lineId === lineId);
          if (!before) return;
          set({ isLoading: true });
          try {
            // Removing the auto-added free item = "no thanks" for this session.
            if (before.freeFor) setFreeDeclined(before.freeFor, true);
            const ok = await mutate((id) => cartLinesRemoveFull(id, [lineId]));
            if (!ok) return;
            track("remove_from_cart", { currency: before.price.currencyCode, value: cartValue([before]), items: gaItems([before]) });
            siteEvent("Removed from Cart", { RemovedItemProductName: before.productTitle, RemovedItemVariant: before.variantTitle, RemovedItemQuantity: before.quantity, WasFree: !!before.freeFor, ...klaviyoCartProps(get().items, get().cart) }, { dl: false, value: cartValue(get().items) });
            if (get().items.length === 0) get().clearCart();
            else await get().reconcile();
          } catch (err) {
            console.error("Failed to remove item:", err);
          } finally {
            set({ isLoading: false });
          }
        },

        swapFreeItem: async (lineId, variantId) => {
          const line = get().items.find((i) => i.lineId === lineId);
          if (!line?.freeFor || line.variantId === variantId) return;
          set({ isLoading: true });
          try {
            await mutate((id) =>
              cartLinesUpdateFull(id, [
                { id: lineId, quantity: line.quantity, merchandiseId: variantId, attributes: [{ key: FREE_ATTR, value: line.freeFor as string }] },
              ]),
            );
          } finally {
            set({ isLoading: false });
          }
        },

        restoreFreeItem: async () => {
          const code = getActiveCode();
          if (!code) return;
          setFreeDeclined(code, false);
          set({ isLoading: true });
          try {
            await get().reconcile();
          } finally {
            set({ isLoading: false });
          }
        },

        reconcile: async () => {
          if (reconciling) return;
          reconciling = true;
          try {
            for (let pass = 0; pass < 3; pass++) {
              const { cart, items } = get();
              if (!cart || !items.length) break;
              const active = getActiveCode();
              const applied = cart.discountCodes.map((d) => d.code.toUpperCase());
              const want = active ? [active.toUpperCase()] : [];
              const ours = applied.filter((c) => dealByCode(c));
              // 1) Code: apply the active one; clear codes WE applied that are no
              //    longer active. Codes we don't know about are left alone.
              const codeOk = active ? applied.length === 1 && applied[0] === want[0] : ours.length === 0;
              if (!codeOk) {
                if (!(await mutate((id) => cartDiscountCodesUpdateFull(id, active ? [active] : [])))) break;
                continue;
              }
              // 2) Free item for buy-X-get-Y.
              const rule = dealByCode(active);
              // Free lines left over from a code that is no longer active go.
              const stale = items.filter((i) => i.freeFor && i.freeFor.toUpperCase() !== (active ?? "").toUpperCase());
              if (stale.length) {
                if (!(await mutate((id) => cartLinesRemoveFull(id, stale.map((s) => s.lineId as string))))) break;
                continue;
              }
              const ev = evaluateDeal(rule, dealLines(items), isFreeDeclined(active));
              if (ev.removeFreeLineId) {
                const lineId = ev.removeFreeLineId;
                if (!(await mutate((id) => cartLinesRemoveFull(id, [lineId])))) break;
                continue;
              }
              if (ev.addFree && rule?.kind === "bxgy") {
                const variantId = pickFreeVariant(rule, items);
                if (!variantId) break;
                const line: NewLine = { merchandiseId: variantId, quantity: rule.get, attributes: [{ key: FREE_ATTR, value: rule.code }] };
                if (!(await mutate((id) => cartLinesAddFull(id, [line]), [line]))) break;
                continue;
              }
              break;
            }
          } catch (err) {
            console.error("Cart reconcile failed:", err);
          } finally {
            reconciling = false;
          }
          const { cart, items } = get();
          const code = getActiveCode();
          emitDealEvents(cart, items, evaluateDeal(dealByCode(code), dealLines(items), isFreeDeclined(code)), code);
        },

        checkout: async (details) => {
          const { cart, isCheckingOut } = get();
          if (!cart || isCheckingOut) return;
          set({ isCheckingOut: true, error: null });
          try {
            if (details?.email) setIdentityEmail(details.email, { firstName: details.firstName, lastName: details.lastName });
            const id = getIdentity();
            const email = id?.email ?? null;
            if (email && get().cart?.email !== email) await mutate((cid) => cartBuyerIdentityUpdateFull(cid, email));
            if (PREFILL_NAMES_AT_CHECKOUT && (id?.firstName || id?.lastName)) {
              await mutate((cid) => cartDeliveryNamesAdd(cid, { firstName: id?.firstName, lastName: id?.lastName }));
            }
            // Refresh attribution + deal on the order, and make sure the code is on.
            await mutate((cid) => cartAttributesUpdateFull(cid, buildAttributes()));
            await get().reconcile();
            const { items, cart: c } = get();
            const url = c?.checkoutUrl;
            if (!url) throw new Error("No checkout URL");
            const value = c?.merchandiseAfterDiscounts ?? cartValue(items);
            track("begin_checkout", {
              currency: c?.currency ?? "USD",
              value,
              num_items: items.reduce((n, i) => n + i.quantity, 0),
              items: gaItems(items),
              content_ids: items.map((i) => i.variantId),
              coupon: c?.discountCodes.find((d) => d.applicable)?.code,
            });
            siteEvent("Started Checkout", { ...klaviyoCartProps(items, c), Savings: c?.savings ?? 0 }, { dl: false, value });
            // Same tab: the shopper stays in one window; the cart syncs (and
            // clears) when they come back after paying.
            window.location.assign(url);
          } catch (err) {
            console.error("Checkout failed:", err);
            set({ isCheckingOut: false, error: "We couldn't open checkout. Please try again." });
          }
        },

        clearCart: () => set({ items: [], cart: null, cartId: null, checkoutUrl: null }),
        getCheckoutUrl: () => get().checkoutUrl,

        syncCart: async () => {
          const { cartId, isSyncing, clearCart } = get();
          // Coming back from checkout (bfcache) must re-enable the button.
          set({ isCheckingOut: false });
          if (!cartId || isSyncing) return;
          set({ isSyncing: true });
          try {
            const cart = await fetchCart(cartId);
            if (!cart || cart.totalQuantity === 0) clearCart();
            else {
              apply(cart);
              await get().reconcile();
            }
          } catch (err) {
            console.error("Failed to sync cart:", err);
          } finally {
            set({ isSyncing: false });
          }
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
      // v1 → v2: items had no lineTotal/freeFor; syncCart refreshes everything
      // from Shopify on load, so just carry the ids over.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<{ items: CartItem[]; cartId: string | null; checkoutUrl: string | null }>;
        return { items: p.items ?? [], cart: null, cartId: p.cartId ?? null, checkoutUrl: p.checkoutUrl ?? null } as never;
      },
    },
  ),
);

/** Wallet changed (new claim, link, or a switch in the cart) → re-apply. */
if (typeof window !== "undefined") {
  window.addEventListener("sunrise:wallet-change", () => {
    useCartStore.getState().reconcile();
  });
}
