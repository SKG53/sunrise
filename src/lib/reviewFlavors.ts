// Flavor catalog for the review form (/reviewsubmit) and its API route
// (/api/public/review). Shared so the page's dropdown labels and the HubSpot
// ticket text always match. Which flavors appear is decided ONLY by
// LIVE_SLUGS in ./liveProducts — no separate list here. Slugs are site slugs
// (e.g. "60mg-blackberry-cbn"), the same ones the PDP routes use; they are not
// Shopify handles.
import { LIVE_SLUGS } from "./liveProducts";

export type Cannabinoid = "CBG" | "CBN" | "THCV";
export type TierKey = "5" | "10" | "30" | "60";
export type Flavor = { name: string; cannabinoid?: Cannabinoid };

const TIERS: { tier: TierKey; label: string; flavors: Flavor[] }[] = [
  {
    tier: "5",
    label: "5MG · Subtle Lift",
    flavors: [
      { name: "Blackberry" },
      { name: "Blood Orange" },
      { name: "Passionfruit Mango" },
      { name: "Blueberry Lemonade", cannabinoid: "CBG" },
      { name: "Black Cherry", cannabinoid: "CBN" },
      { name: "Strawberry Peach", cannabinoid: "THCV" },
    ],
  },
  {
    tier: "10",
    label: "10MG · Perfect Buzz",
    flavors: [
      { name: "Strawberry" },
      { name: "Watermelon" },
      { name: "Lemonade" },
      { name: "Tangerine", cannabinoid: "CBG" },
      { name: "Blackberry Lemonade", cannabinoid: "CBN" },
      { name: "Blueberry Acai", cannabinoid: "THCV" },
    ],
  },
  {
    tier: "30",
    label: "30MG · Deeper Dive",
    flavors: [
      { name: "Peach Mango" },
      { name: "Cherry Limeade" },
      { name: "Orange Lemonade" },
      { name: "Kiwi Watermelon", cannabinoid: "CBG" },
      { name: "Blueberry Pomegranate", cannabinoid: "CBN" },
      { name: "Strawberry Watermelon", cannabinoid: "THCV" },
    ],
  },
  {
    tier: "60",
    label: "60MG · Elevated Experience",
    flavors: [
      { name: "Passionfruit Mango" },
      { name: "Wild Cherry Peach" },
      { name: "Blueberry Lemonade" },
      { name: "Blood Orange", cannabinoid: "CBG" },
      { name: "Blackberry", cannabinoid: "CBN" },
      { name: "Strawberry Kiwi", cannabinoid: "THCV" },
    ],
  },
];

// Same slug rule as the storefront (src/routes/products.tsx).
export function toSlug(tier: TierKey, f: Flavor): string {
  const base = f.name.toLowerCase().replace(/\s+/g, "-");
  const suffix = f.cannabinoid ? `-${f.cannabinoid.toLowerCase()}` : "";
  return `${tier}mg-${base}${suffix}`;
}

export function optionLabel(tier: TierKey, f: Flavor): string {
  return `${f.name} (${tier}MG${f.cannabinoid ? ` + ${f.cannabinoid}` : ""})`;
}

// Tiers holding only the flavors currently sold; empty tiers drop out.
export const REVIEW_TIERS = TIERS.map(({ tier, label, flavors }) => ({
  tier,
  label,
  flavors: flavors.filter((f) => LIVE_SLUGS.has(toSlug(tier, f))),
})).filter((t) => t.flavors.length > 0);

// slug → label, in display order (tier, then flavor position).
export const REVIEW_FLAVOR_LABELS = new Map<string, string>(
  REVIEW_TIERS.flatMap(({ tier, flavors }) =>
    flavors.map((f) => [toSlug(tier, f), optionLabel(tier, f)] as const),
  ),
);
export const REVIEW_FLAVOR_ORDER = [...REVIEW_FLAVOR_LABELS.keys()];
