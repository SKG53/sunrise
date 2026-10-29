// The 15 live "4 PACK" variants. Ported from the lander (sunrise-lander
// src/lib/liveFourPacks.ts @ b1e3421) for the main-site Build Your Box pages
// (components/BuildYourBox.tsx) and the cart's free-item picker (lib/deals.ts).
//
// Variant IDs verified in Shopify Admin Oct 11 2026 and re-checked against the
// live discount rules Oct 28 2026: all 15 are "4 PACK", ACTIVE, at $20.95
// (10 mg) / $24.95 (30 mg) / $28.95 (60 mg).
// ⚠ Shopify also has 5 mg products with the same flavor names (Blackberry,
// Blood Orange, Passionfruit Mango, Blueberry Lemonade). Use THESE IDs only.
//
// Slugs match the main-site PDP slugs and public/images/cans/<slug>.webp.
// Prices are re-fetched from the Storefront API on load; `fallbackPrice` is
// used only if that fetch fails.

export type Tier = 10 | 30 | 60;
export type Cannabinoid = "CBG" | "CBN" | "THCV";

export type FourPack = {
  slug: string;
  flavor: string;
  descriptor: string;
  color: string;
  tier: Tier;
  cannabinoid?: Cannabinoid;
  variantId: string;
  fallbackPrice: number;
  // Explicit name lines for 3-word flavors; card name blocks reserve 2 lines.
  nameLines?: string[];
};

const V = (id: string) => `gid://shopify/ProductVariant/${id}`;

export const FALLBACK_PRICE: Record<Tier, number> = { 10: 20.95, 30: 24.95, 60: 28.95 };

export const LIVE_FOUR_PACKS: FourPack[] = [
  {
    slug: "10mg-strawberry",
    flavor: "Strawberry",
    descriptor: "Fresh + Fruity",
    color: "#CC1F39",
    tier: 10,
    variantId: V("47935675203796"),
    fallbackPrice: 20.95,
  },
  {
    slug: "10mg-watermelon",
    flavor: "Watermelon",
    descriptor: "Sweet + Juicy",
    color: "#0A6034",
    tier: 10,
    variantId: V("47935675498708"),
    fallbackPrice: 20.95,
  },
  {
    slug: "10mg-lemonade",
    flavor: "Lemonade",
    descriptor: "Crisp + Tangy",
    color: "#E0AD2C",
    tier: 10,
    variantId: V("47935673991380"),
    fallbackPrice: 20.95,
  },
  {
    slug: "30mg-peach-mango",
    flavor: "Peach Mango",
    descriptor: "Lush + Tropical",
    color: "#E59177",
    tier: 30,
    variantId: V("47935676743892"),
    fallbackPrice: 24.95,
  },
  {
    slug: "30mg-cherry-limeade",
    flavor: "Cherry Limeade",
    descriptor: "Tart + Refreshing",
    color: "#67092A",
    tier: 30,
    variantId: V("47935676317908"),
    fallbackPrice: 24.95,
  },
  {
    slug: "30mg-orange-lemonade",
    flavor: "Orange Lemonade",
    descriptor: "Bright + Tart",
    color: "#FAA819",
    tier: 30,
    variantId: V("47935676547284"),
    fallbackPrice: 24.95,
  },
  {
    slug: "30mg-kiwi-watermelon-cbg",
    flavor: "Kiwi Watermelon",
    descriptor: "Crisp + Cool",
    color: "#A4BC47",
    tier: 30,
    cannabinoid: "CBG",
    variantId: V("47935676973268"),
    fallbackPrice: 24.95,
  },
  {
    slug: "30mg-blueberry-pomegranate-cbn",
    flavor: "Blueberry Pomegranate",
    descriptor: "Tart + Vibrant",
    color: "#21285A",
    tier: 30,
    cannabinoid: "CBN",
    variantId: V("47935677169876"),
    fallbackPrice: 24.95,
  },
  {
    slug: "30mg-strawberry-watermelon-thcv",
    flavor: "Strawberry Watermelon",
    descriptor: "Sweet + Fresh",
    color: "#0A6034",
    tier: 30,
    cannabinoid: "THCV",
    variantId: V("47935677432020"),
    fallbackPrice: 24.95,
  },
  {
    slug: "60mg-wild-cherry-peach",
    flavor: "Wild Cherry Peach",
    descriptor: "Lush + Juicy",
    color: "#861625",
    tier: 60,
    variantId: V("47935673663700"),
    fallbackPrice: 28.95,
    nameLines: ["Wild Cherry", "Peach"],
  },
  {
    slug: "60mg-blueberry-lemonade",
    flavor: "Blueberry Lemonade",
    descriptor: "Rich + Tangy",
    color: "#21285A",
    tier: 60,
    variantId: V("47935674187988"),
    fallbackPrice: 28.95,
  },
  {
    slug: "60mg-passionfruit-mango",
    flavor: "Passionfruit Mango",
    descriptor: "Bright + Breezy",
    color: "#60203A",
    tier: 60,
    variantId: V("47935674777812"),
    fallbackPrice: 28.95,
  },
  {
    slug: "60mg-blood-orange-cbg",
    flavor: "Blood Orange",
    descriptor: "Tart + Punchy",
    color: "#DC7F27",
    tier: 60,
    cannabinoid: "CBG",
    variantId: V("47935674384596"),
    fallbackPrice: 28.95,
  },
  {
    slug: "60mg-blackberry-cbn",
    flavor: "Blackberry",
    descriptor: "Dark + Smooth",
    color: "#2E1E3D",
    tier: 60,
    cannabinoid: "CBN",
    variantId: V("47935674581204"),
    fallbackPrice: 28.95,
  },
  {
    slug: "60mg-strawberry-kiwi-thcv",
    flavor: "Strawberry Kiwi",
    descriptor: "Sweet + Tangy",
    color: "#CC1F39",
    tier: 60,
    cannabinoid: "THCV",
    variantId: V("47935675007188"),
    fallbackPrice: 28.95,
  },
];

// The free 4-pack options: the three live 10 mg ("Perfect Buzz") 4-packs.
export const FREE_10MG: FourPack[] = LIVE_FOUR_PACKS.filter((p) =>
  ["10mg-strawberry", "10mg-watermelon", "10mg-lemonade"].includes(p.slug),
);

export const packBySlug = (slug: string | null | undefined): FourPack | null =>
  LIVE_FOUR_PACKS.find((p) => p.slug === slug) ?? null;

export const packByVariantId = (variantId: string | null | undefined): FourPack | null =>
  LIVE_FOUR_PACKS.find((p) => p.variantId === variantId) ?? null;

/** Card-sized can render for grids/cart rows (see public/images/cans/card/). */
export const cardCanSrc = (slug: string) => `/images/cans/card/${slug}.webp`;
