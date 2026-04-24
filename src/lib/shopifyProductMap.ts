// Maps your existing 24 SKU slugs (from products_.$slug.tsx) to Shopify
// product handles + variant selection rules.
//
// Wire up one SKU at a time as a pilot. When a slug isn't in this map,
// the product detail page falls back to hardcoded data + "Find Near You".
//
// Variant selection: each Shopify product has 2 variants (Single Can / 4-Pack
// Carton). We pick the Single Can by default for the hero price.

export type ShopifyProductMapping = {
  /** Shopify product handle (e.g. "lemonade") */
  handle: string;
  /** Default variant option to pre-select in the hero */
  defaultPackOption: "Single Can" | "4-Pack Carton";
};

export const SHOPIFY_PRODUCT_MAP: Record<string, ShopifyProductMapping> = {
  // ── PILOT: 10mg Lemonade ──────────────────────────────────────────────
  "10mg-lemonade": { handle: "lemonade", defaultPackOption: "Single Can" },

  // Future SKUs go here as we wire each one. Examples (uncomment when ready):
  // "5mg-blackberry": { handle: "blackberry-seltzer", defaultPackOption: "Single Can" },
  // "10mg-strawberry": { handle: "strawberry-seltzer", defaultPackOption: "Single Can" },
  // "10mg-watermelon": { handle: "watermelon-seltzer", defaultPackOption: "Single Can" },
};

export function getShopifyMapping(slug: string): ShopifyProductMapping | null {
  return SHOPIFY_PRODUCT_MAP[slug] ?? null;
}