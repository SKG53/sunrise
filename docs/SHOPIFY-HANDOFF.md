# Shopify ↔ Lovable Handoff Document

Saved before disconnecting Shopify so a remix can pick up exactly where this project left off.

---

## 1. Store identity (hardcoded — survives remix)

In `src/lib/shopify.ts` lines 5–8. Publishable values, safe to commit:

- `SHOPIFY_API_VERSION = "2025-07"`
- `SHOPIFY_STORE_PERMANENT_DOMAIN = "30dfrv-hs.myshopify.com"`
- `SHOPIFY_STOREFRONT_TOKEN = "57d9eebab19ddb5f3b3d1e5dcd320b20"` (Storefront API access token — client-side safe)
- `SHOPIFY_STOREFRONT_URL = https://30dfrv-hs.myshopify.com/api/2025-07/graphql.json`

> ⚠️ If reconnecting the SAME store issues a new Storefront token, verify by running `shopify--get_shop_permanent_domain` and `shopify--get_storefront_token` post-reconnect and updating `src/lib/shopify.ts` if different.

## 2. Connection type

- **Existing store** (not a Lovable-created dev store). No claim flow needed.
- Only the Storefront API is used at runtime (no Admin API calls from the app).
- Admin API access is only used by the Lovable agent tools (`shopify--*`) for product management via chat — not by the deployed site.

## 3. Files that touch Shopify (all transfer in remix)

| File | Role |
|---|---|
| `src/lib/shopify.ts` | Storefront GraphQL client, product-by-handle query, cart create/add/update/remove mutations, checkout URL formatter (adds `channel=online_store`) |
| `src/lib/shopifyProductMap.ts` | Maps 24 site slugs → Shopify product handles + default pack option |
| `src/hooks/useShopifyProduct.ts` | React hook: fetch single product by handle |
| `src/hooks/useCartSync.ts` | Syncs local cart with Shopify on tab visibility / mount |
| `src/stores/cartStore.ts` | Zustand persisted cart (`localStorage` key `shopify-cart`); holds `items`, `cartId`, `checkoutUrl` |
| `src/components/CartDrawer.tsx` | Cart UI + checkout button (opens `checkoutUrl` in new tab) |
| `src/routes/products.tsx` | Grid — reads Shopify images for mapped SKUs |
| `src/routes/products_.$slug.tsx` | PDP — full Shopify integration (variants, pack selector, price, images, description, add-to-cart) |
| `src/routes/hbe.tsx` | Uses `getShopifyMapping` |

## 4. Runtime data flow

1. PDP loads → `useShopifyProduct(handle)` → `fetchProductByHandle` → Storefront GraphQL `product(handle)` query (returns id, title, description, descriptionHtml, priceRange, images[5], variants[10] with `id/title/price/availableForSale/selectedOptions`, options).
2. User clicks Add to Cart → `cartStore.addItem`:
   - No `cartId` → `cartCreate` mutation → stores `cartId`, `checkoutUrl`, and Shopify `lineId`.
   - Existing item → `cartLinesUpdate` with new qty.
   - New item on existing cart → `cartLinesAdd`.
3. Checkout button → `window.open(checkoutUrl, "_blank")`. URL is force-appended `?channel=online_store` so it bypasses password protection.
4. On tab visibility → `syncCart` runs `cart($id)` query; if `totalQuantity === 0` → `clearCart()`.
5. `cartNotFound` errors from any mutation → `clearCart()` (cart expired on Shopify's side).

## 5. Product mapping — the 24 SKUs

`SHOPIFY_PRODUCT_MAP` in `src/lib/shopifyProductMap.ts` maps 4 tiers × 6 flavors:

- 5mg: blackberry, blood-orange, passionfruit-mango, blueberry-lemonade (CBG→base), black-cherry (CBN→base), strawberry-peach (THCV→base)
- 10mg: lemonade, strawberry, watermelon, tangerine (CBG), blackberry-lemonade (CBN), blueberry-acai (THCV)
- 30mg: peach-mango, cherry-limeade, orange-lemonade, kiwi-watermelon (CBG), blueberry-pomegranate (CBN), strawberry-watermelon (THCV)
- 60mg: wild-cherry-peach, blueberry-lemonade, passionfruit-mango, blood-orange (CBG), blackberry (CBN), strawberry-kiwi (THCV)

Each maps to `{ handle, defaultPackOption: "Single Can" | "4-Pack Carton" }`. All default to Single Can. Cannabinoid variants (CBG/CBN/THCV) collapse to the base flavor's Shopify product.

## 6. Cart schema (localStorage `shopify-cart`)

```ts
{ items: CartItem[], cartId: string|null, checkoutUrl: string|null }
CartItem = { lineId, variantId, productHandle, productTitle, variantTitle, imageUrl, price:{amount,currencyCode}, quantity, selectedOptions[] }
```

Persisted carts survive remix+reconnect only if the same store is reconnected (same `cartId` namespace).

## 7. What breaks on disconnect (and heals on reconnect)

| While disconnected | Behavior |
|---|---|
| Preview / any new build | Storefront calls fail, cart is broken, PDPs show loading/error. |
| Published live site (savorsunrise.com) | Unaffected — not republishing. Live continues using baked-in credentials. |

On reconnect: everything works again the moment the token/domain match. If reconnect issues a new Storefront token, update `src/lib/shopify.ts` line 8.

## 8. Other connectors on this project

- **Lovable Cloud (Supabase)** does NOT transfer through remix. Remix gets a fresh Cloud instance. Current `.env` vars:
  - `VITE_SUPABASE_PROJECT_ID`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_URL`
- **HubSpot** — reconnect separately if the remix uses it.
- No custom secrets are used by Shopify code paths (Storefront token is hardcoded because it's publishable).

## 9. Verification checklist after remix + reconnect

1. `shopify--get_shop_permanent_domain` returns `30dfrv-hs.myshopify.com` — else update `src/lib/shopify.ts` line 6.
2. `shopify--get_storefront_token` — else update line 8.
3. Load `/products/10mg-lemonade` — should render Shopify title/price/image and enable Add to Cart.
4. Add to cart → open drawer → click Checkout → new tab opens Shopify checkout with `channel=online_store` param.
5. Reconnect HubSpot / Cloud only if the remix actually uses them.

## 10. Rollback

Disconnect modifies no code and no Shopify store data. Reconnecting the same store is sufficient — no migration or data restore needed.