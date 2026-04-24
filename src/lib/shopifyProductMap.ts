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
  // ── 10mg tier (all 6 active in Shopify) ───────────────────────────────
  // Note: cannabinoid variants (CBG/CBN/THCV) map to the base flavor in Shopify
  // since Shopify doesn't yet carry the cannabinoid distinction.
  "10mg-lemonade":                  { handle: "10mg-lemonade",            defaultPackOption: "Single Can" },
  "10mg-strawberry":                { handle: "10mg-strawberry",          defaultPackOption: "Single Can" },
  "10mg-watermelon":                { handle: "10mg-watermelon",          defaultPackOption: "Single Can" },
  "10mg-tangerine-cbg":             { handle: "10mg-tangerine",           defaultPackOption: "Single Can" },
  "10mg-blackberry-lemonade-cbn":   { handle: "10mg-blackberry-lemonade", defaultPackOption: "Single Can" },
  "10mg-blueberry-acai-thcv":       { handle: "10mg-blueberry-acai",      defaultPackOption: "Single Can" },

  // ── 30mg tier (all 6 active in Shopify) ───────────────────────────────
  // Note: cannabinoid variants (CBG/CBN/THCV) map to the base flavor in Shopify
  // since Shopify doesn't yet carry the cannabinoid distinction.
  "30mg-peach-mango":                  { handle: "30mg-peach-mango",            defaultPackOption: "Single Can" },
  "30mg-cherry-limeade":               { handle: "30mg-cherry-limeade",         defaultPackOption: "Single Can" },
  "30mg-orange-lemonade":              { handle: "30mg-orange-lemonade",        defaultPackOption: "Single Can" },
  "30mg-kiwi-watermelon-cbg":          { handle: "30mg-kiwi-watermelon",        defaultPackOption: "Single Can" },
  "30mg-blueberry-pomegranate-cbn":    { handle: "30mg-blueberry-pomegranate",  defaultPackOption: "Single Can" },
  "30mg-strawberry-watermelon-thcv":   { handle: "30mg-strawberry-watermelon",  defaultPackOption: "Single Can" },

  // ── 60mg tier (all 6 active in Shopify) ───────────────────────────────
  // Note: cannabinoid variants (CBG/CBN/THCV) map to the base flavor in Shopify
  // since Shopify doesn't yet carry the cannabinoid distinction.
  "60mg-wild-cherry-peach":     { handle: "60mg-wild-cherry-peach",   defaultPackOption: "Single Can" },
  "60mg-blueberry-lemonade":    { handle: "60mg-blueberry-lemonade",  defaultPackOption: "Single Can" },
  "60mg-passionfruit-mango":    { handle: "60mg-passionfruit-mango",  defaultPackOption: "Single Can" },
  "60mg-blood-orange-cbg":      { handle: "60mg-blood-orange",        defaultPackOption: "Single Can" },
  "60mg-blackberry-cbn":        { handle: "60mg-blackberry",          defaultPackOption: "Single Can" },
  "60mg-strawberry-kiwi-thcv":  { handle: "60mg-strawberry-kiwi",     defaultPackOption: "Single Can" },
};

export function getShopifyMapping(slug: string): ShopifyProductMapping | null {
  return SHOPIFY_PRODUCT_MAP[slug] ?? null;
}