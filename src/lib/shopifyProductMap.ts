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

  // ── 60mg tier (all 6 active in Shopify) ───────────────────────────────
  // Note: cannabinoid variants (CBG/CBN/THCV) map to the base flavor in Shopify
  // since Shopify doesn't yet carry the cannabinoid distinction.
  "60mg-wild-cherry-peach":     { handle: "wild-cherry-peach",   defaultPackOption: "Single Can" },
  "60mg-blueberry-lemonade":    { handle: "blueberry-lemonade",  defaultPackOption: "Single Can" },
  "60mg-passionfruit-mango":    { handle: "passionfruit-mango",  defaultPackOption: "Single Can" },
  "60mg-blood-orange-cbg":      { handle: "blood-orange",        defaultPackOption: "Single Can" },
  "60mg-blackberry-cbn":        { handle: "blackberry",          defaultPackOption: "Single Can" },
  "60mg-strawberry-kiwi-thcv":  { handle: "strawberry-kiwi",     defaultPackOption: "Single Can" },
};

export function getShopifyMapping(slug: string): ShopifyProductMapping | null {
  return SHOPIFY_PRODUCT_MAP[slug] ?? null;
}