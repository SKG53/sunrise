// =============================================================================
// SUNRISE — TanStack query keys for Storefront API
// Path: src/lib/storefront/keys.ts
// Session: SBev.BC.Shopify.1
//
// Centralized query key factory. Using consistent keys is critical for cache
// invalidation — when we mutate the cart, we invalidate by key here and every
// subscribed hook re-fetches automatically.
// =============================================================================

export const storefrontKeys = {
  all: ["storefront"] as const,

  products: () => [...storefrontKeys.all, "products"] as const,
  productsList: (queryString?: string) =>
    [...storefrontKeys.products(), "list", queryString ?? "all"] as const,
  product: (handle: string) =>
    [...storefrontKeys.products(), "byHandle", handle] as const,

  cart: () => [...storefrontKeys.all, "cart"] as const,
  cartById: (cartId: string | null) =>
    [...storefrontKeys.cart(), cartId ?? "none"] as const,
};