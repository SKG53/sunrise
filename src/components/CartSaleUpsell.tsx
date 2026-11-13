// CART SALE UPSELL (lib/sale.ts): shown in the cart footer, right above the
// total and the Checkout button, while a sale phase is on. If the cart has
// no drink from a sale group, it offers that group at the sale price:
//   - no 10mg in the cart        → "Add The Perfect Buzz at 60% off" (3 flavors)
//   - no 30mg or 60mg in the cart → "Add 30mg + 60mg at 30% off" (3 flavors)
// A 5mg-only cart sees both. One tap adds a 4-pack; the cart then applies the
// code itself. Prices shown are the 4-pack list price and the sale price
// (salePrice mirrors Shopify's rounding); the cart total is still Shopify's.

import { siteEvent } from "@/lib/siteEvents";
import { tierOf } from "@/lib/deals";
import { cardCanSrc, packBySlug, type FourPack } from "@/lib/liveFourPacks";
import { SALE_ALL_LABEL, SALE_ALL_TIERS, salePrice, type SalePhase } from "@/lib/sale";
import type { AddInput, CartItem } from "@/stores/cartStore";

// The 10mg picks are the three Core flavors (the expiring pallets).
const TEN_PICKS = ["10mg-strawberry", "10mg-watermelon", "10mg-lemonade"];
const ALL_PICKS = ["60mg-wild-cherry-peach", "30mg-peach-mango", "60mg-passionfruit-mango"];

const money = (n: number) => `$${n.toFixed(2)}`;

function toAdd(p: FourPack): AddInput {
  return {
    variantId: p.variantId,
    productHandle: p.slug,
    productTitle: p.flavor,
    variantTitle: "4 PACK",
    imageUrl: cardCanSrc(p.slug),
    price: { amount: p.fallbackPrice.toFixed(2), currencyCode: "USD" },
    quantity: 1,
    selectedOptions: [{ name: "Pack", value: "4 PACK" }],
  };
}

export function CartSaleUpsell({
  sale,
  items,
  busy,
  onAdd,
}: {
  sale: SalePhase;
  items: CartItem[];
  busy: boolean;
  onAdd: (item: AddInput) => void;
}) {
  let hasTen = false;
  let hasAll = false;
  for (const i of items) {
    const t = tierOf(i.productHandle);
    if (t === 10) hasTen = true;
    else if (t !== null && (SALE_ALL_TIERS as readonly number[]).includes(t)) hasAll = true;
  }
  if (hasTen && hasAll) return null;

  const rows: Array<{ key: string; title: string; pct: number; picks: FourPack[] }> = [];
  if (!hasTen) {
    rows.push({
      key: "ten",
      title: `Add The Perfect Buzz at ${sale.pctTen}% off`,
      pct: sale.pctTen,
      picks: TEN_PICKS.map(packBySlug).filter((p): p is FourPack => !!p),
    });
  }
  if (!hasAll) {
    rows.push({
      key: "all",
      title: `Add ${SALE_ALL_LABEL} at ${sale.pctAll}% off`,
      pct: sale.pctAll,
      picks: ALL_PICKS.map(packBySlug).filter((p): p is FourPack => !!p),
    });
  }

  return (
    <div className="cart-upsell" aria-label="Sale offers">
      {rows.map((row) => (
        <div key={row.key} className="cart-upsell-row">
          <p className="cart-upsell-title">{row.title}</p>
          <ul className="cart-upsell-list">
            {row.picks.map((p) => (
              <li key={p.slug} className="cart-upsell-item">
                <img src={cardCanSrc(p.slug)} alt="" className="cart-upsell-img" loading="lazy" />
                <span className="cart-upsell-name">
                  {p.flavor}
                  <span className="cart-upsell-tier"> · {p.tier}mg 4-pack</span>
                </span>
                <span className="cart-upsell-price">
                  <s>{money(p.fallbackPrice)}</s> {money(salePrice(p.fallbackPrice, row.pct))}
                </span>
                <button
                  type="button"
                  className="cart-upsell-add"
                  disabled={busy}
                  onClick={() => {
                    siteEvent("Sale Upsell Added", { slug: p.slug, tier: p.tier, row: row.key });
                    onAdd(toAdd(p));
                  }}
                  aria-label={`Add ${p.flavor} ${p.tier}mg 4-pack`}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
