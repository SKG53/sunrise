// =============================================================================
// SUNRISE — useCart hook
// Path: src/hooks/shopify/useCart.ts
// Session: SBev.BC.Shopify.1
//
// The cart is the center of gravity for e-commerce state. Pattern:
//   - Cart ID is persisted in localStorage under CART_ID_KEY.
//   - The cart itself lives in TanStack's query cache, keyed by cart ID.
//   - Every component that needs cart data calls useCart() and reads the same
//     cached data. Mutations invalidate the cart query, triggering automatic
//     re-render everywhere.
// =============================================================================

import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import {
  CART_QUERY,
  flattenCart,
  storefrontKeys,
  storefrontRequest,
  type Cart,
} from "../../lib/storefront";

export const CART_ID_KEY = "sunrise-cart-id";

// ── LOCALSTORAGE ADAPTER ─────────────────────────────────────────────────
// Using useSyncExternalStore so any component reading the cart ID stays in sync
// across tabs and across programmatic setCartId() calls in the same tab.

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("sunrise-cart-id-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("sunrise-cart-id-change", callback);
  };
}

function getCartIdSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CART_ID_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

export function useCartId(): string | null {
  return useSyncExternalStore(subscribe, getCartIdSnapshot, getServerSnapshot);
}

export function setCartId(cartId: string | null): void {
  if (typeof window === "undefined") return;
  if (cartId === null) {
    window.localStorage.removeItem(CART_ID_KEY);
  } else {
    window.localStorage.setItem(CART_ID_KEY, cartId);
  }
  window.dispatchEvent(new Event("sunrise-cart-id-change"));
}

// ── CART QUERY ───────────────────────────────────────────────────────────

interface CartRaw {
  cart: Parameters<typeof flattenCart>[0];
}

/**
 * Get the current cart. Returns null before the user adds their first item
 * (no cart ID yet) or if the cart was cleared.
 */
export function useCart() {
  const cartId = useCartId();

  const query = useQuery<Cart | null>({
    queryKey: storefrontKeys.cartById(cartId),
    enabled: Boolean(cartId),
    queryFn: async () => {
      if (!cartId) return null;
      const data = await storefrontRequest<CartRaw>(CART_QUERY, { cartId });
      // If Shopify returns null (e.g., cart expired, invalid ID), clear it locally.
      if (data.cart === null) {
        setCartId(null);
        return null;
      }
      return flattenCart(data.cart);
    },
    staleTime: 0, // Cart freshness matters — always refetch when invalidated
  });

  return {
    ...query,
    cart: query.data ?? null,
    cartId,
    isEmpty: !query.data || query.data.totalQuantity === 0,
  };
}