// Single source of truth for which product detail pages are publicly live.
// Consumed by src/routes/products_.$slug.tsx (route guard + grid filter) and
// by src/routes/sitemap[.]xml.ts so the sitemap can never drift from the
// set of PDPs that actually resolve.
export const LIVE_SLUGS = new Set<string>([
  "10mg-strawberry",
  "10mg-watermelon",
  "10mg-lemonade",
  "30mg-peach-mango",
  "30mg-cherry-limeade",
  "30mg-orange-lemonade",
  "30mg-kiwi-watermelon-cbg",
  "30mg-blueberry-pomegranate-cbn",
  "30mg-strawberry-watermelon-thcv",
  "60mg-wild-cherry-peach",
  "60mg-blueberry-lemonade",
  "60mg-passionfruit-mango",
  "60mg-blood-orange-cbg",
  "60mg-blackberry-cbn",
  "60mg-strawberry-kiwi-thcv",
]);
