// =============================================================================
// SUNRISE — Storefront response flatteners
// Path: src/lib/storefront/flatten.ts
// Session: SBev.BC.Shopify.1
//
// Shopify's GraphQL schema wraps lists in { edges: [{ node: T }] } for pagination.
// Our consumer-facing types use plain T[]. These helpers bridge the gap so the
// hooks layer never has to deal with edges/nodes.
// =============================================================================

import type {
  Cart,
  CartLine,
  Product,
  ProductVariant,
  StorefrontImage,
} from "./types";

// ── RAW (edges/nodes) RESPONSE SHAPES ────────────────────────────────────
interface RawEdges<T> {
  edges: Array<{ node: T }>;
}

interface RawProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  featuredImage: StorefrontImage | null;
  images: RawEdges<StorefrontImage>;
  variants: RawEdges<ProductVariant>;
  priceRange: Product["priceRange"];
}

interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: Cart["cost"];
  lines: RawEdges<CartLine>;
}

// ── FLATTENERS ───────────────────────────────────────────────────────────
export function flattenProduct(raw: RawProduct | null): Product | null {
  if (!raw) return null;
  return {
    ...raw,
    images: raw.images?.edges?.map((e) => e.node) ?? [],
    variants: raw.variants?.edges?.map((e) => e.node) ?? [],
  };
}

export function flattenProducts(rawList: RawEdges<RawProduct>): Product[] {
  return (
    rawList?.edges
      ?.map((e) => flattenProduct(e.node))
      .filter((p): p is Product => p !== null) ?? []
  );
}

export function flattenCart(raw: RawCart | null): Cart | null {
  if (!raw) return null;
  return {
    ...raw,
    lines: raw.lines?.edges?.map((e) => e.node) ?? [],
  };
}