// Shopify Storefront API helper + cart mutations.
// Used by the cart store and product detail pages to fetch live product data
// and create/update Shopify carts that lead to a real Shopify checkout.

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "30dfrv-hs.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "0c6e1f66aff25c00f2fc11de114ecbd9";

export interface ShopifyImage {
  url: string;
  altText: string | null;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  availableForSale: boolean;
  barcode: string | null;
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    descriptionHtml: string;
    handle: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: ShopifyImage }> };
    variants: { edges: Array<{ node: ShopifyVariant }> };
    options: Array<{ name: string; values: string[] }>;
  };
}

export async function storefrontApiRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ data?: T; errors?: Array<{ message: string }> } | null> {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 402) {
    console.error("Shopify: Payment required");
    return null;
  }

  if (!response.ok) {
    throw new Error(`Shopify API HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`Shopify API: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
  }
  return json;
}

// ── PRODUCT QUERY ───────────────────────────────────────────────────────
const PRODUCT_BY_HANDLE_QUERY = `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      descriptionHtml
      handle
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 5) { edges { node { url altText } } }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price { amount currencyCode }
            availableForSale
            barcode
            selectedOptions { name value }
          }
        }
      }
      options { name values }
    }
  }
`;

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest<{ product: ShopifyProduct["node"] | null }>(
    PRODUCT_BY_HANDLE_QUERY,
    { handle }
  );
  if (!data?.data?.product) return null;
  return { node: data.data.product };
}

// ── CART MUTATIONS ──────────────────────────────────────────────────────
export const CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) { id totalQuantity }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id }
      userErrors { field message }
    }
  }
`;

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(
  userErrors: Array<{ field: string[] | null; message: string }>
): boolean {
  return userErrors.some(
    (e) =>
      e.message.toLowerCase().includes("cart not found") ||
      e.message.toLowerCase().includes("does not exist")
  );
}

export async function createShopifyCart(
  variantId: string,
  quantity: number
): Promise<{ cartId: string; checkoutUrl: string; lineId: string } | null> {
  type CartCreateData = {
    cartCreate: {
      cart: {
        id: string;
        checkoutUrl: string;
        lines: { edges: Array<{ node: { id: string } }> };
      } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  };
  const data = await storefrontApiRequest<CartCreateData>(CART_CREATE_MUTATION, {
    input: { lines: [{ quantity, merchandiseId: variantId }] },
  });

  const userErrors = data?.data?.cartCreate?.userErrors || [];
  if (userErrors.length > 0) {
    console.error("Cart creation failed:", userErrors);
    return null;
  }
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const lineId = cart.lines.edges[0]?.node?.id;
  if (!lineId) return null;

  return { cartId: cart.id, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl), lineId };
}

export async function addLineToShopifyCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<{ success: boolean; lineId?: string; cartNotFound?: boolean }> {
  type AddData = {
    cartLinesAdd: {
      cart: { lines: { edges: Array<{ node: { id: string; merchandise: { id: string } } }> } } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  };
  const data = await storefrontApiRequest<AddData>(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity, merchandiseId: variantId }],
  });

  const userErrors = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Add line failed:", userErrors);
    return { success: false };
  }

  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
  const newLine = lines.find((l) => l.node.merchandise.id === variantId);
  return { success: true, lineId: newLine?.node?.id };
}

export async function updateShopifyCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  type UpdateData = {
    cartLinesUpdate: {
      cart: { id: string } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  };
  const data = await storefrontApiRequest<UpdateData>(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Update line failed:", userErrors);
    return { success: false };
  }
  return { success: true };
}

export async function removeLineFromShopifyCart(
  cartId: string,
  lineId: string
): Promise<{ success: boolean; cartNotFound?: boolean }> {
  type RemoveData = {
    cartLinesRemove: {
      cart: { id: string } | null;
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  };
  const data = await storefrontApiRequest<RemoveData>(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });

  const userErrors = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
  if (userErrors.length > 0) {
    console.error("Remove line failed:", userErrors);
    return { success: false };
  }
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════
// FULL CART API (site pass 1, Oct 28 2026)
// Every mutation below returns the whole cart (CART_FIELDS) so the store can
// render Shopify's own numbers: real line totals, the applied code and
// whether it is applicable, and the discount amount. The older helpers above
// are kept for anything still importing them.
// ═══════════════════════════════════════════════════════════════════════

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  buyerIdentity { email }
  attributes { key value }
  discountCodes { code applicable }
  cost {
    subtotalAmount { amount currencyCode }
    totalAmount { amount currencyCode }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        attributes { key value }
        cost {
          subtotalAmount { amount }
          totalAmount { amount }
        }
        discountAllocations { discountedAmount { amount } }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            price { amount currencyCode }
            image { url }
            selectedOptions { name value }
            product { id handle title featuredImage { url } }
          }
        }
      }
    }
  }
`;

type RawLine = {
  id: string;
  quantity: number;
  attributes: Array<{ key: string; value: string | null }>;
  cost: { subtotalAmount: { amount: string }; totalAmount: { amount: string } };
  discountAllocations: Array<{ discountedAmount: { amount: string } }>;
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: { amount: string; currencyCode: string };
    image: { url: string } | null;
    selectedOptions: Array<{ name: string; value: string }>;
    product: { id: string; handle: string; title: string; featuredImage: { url: string } | null };
  };
};
type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  buyerIdentity: { email: string | null } | null;
  attributes: Array<{ key: string; value: string | null }>;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: { edges: Array<{ node: RawLine }> };
};

export type CartLineView = {
  lineId: string;
  variantId: string;
  /** Numeric Shopify product id (Klaviyo catalog uses product ids). */
  productId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string | null;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
  /** What Shopify charges for this line after line-level discounts. */
  lineTotal: number;
  /** Line total before discounts. */
  lineSubtotal: number;
  lineDiscount: number;
  attributes: Record<string, string>;
};

export type CartView = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  email: string | null;
  attributes: Record<string, string>;
  discountCodes: Array<{ code: string; applicable: boolean }>;
  currency: string;
  /** Sum of line prices before any discount. */
  merchandiseBeforeDiscounts: number;
  /** Sum of line totals after Shopify's line discounts (free-ship meter basis). */
  merchandiseAfterDiscounts: number;
  /** merchandiseBeforeDiscounts − merchandiseAfterDiscounts (what the code saved). */
  savings: number;
  lines: CartLineView[];
};

const num = (s: string | undefined | null) => {
  const n = parseFloat(s ?? "");
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const toMap = (a: Array<{ key: string; value: string | null }> | undefined) =>
  Object.fromEntries((a ?? []).map((x) => [x.key, x.value ?? ""]));

function normalizeCart(c: RawCart): CartView {
  const lines: CartLineView[] = c.lines.edges.map(({ node: l }) => {
    const lineSubtotal = round2(num(l.merchandise.price.amount) * l.quantity);
    const alloc = l.discountAllocations.reduce((s, d) => s + num(d.discountedAmount.amount), 0);
    // cost.totalAmount already nets line-level discounts; fall back to the
    // allocations if Shopify ever returns it gross.
    const total = num(l.cost.totalAmount.amount);
    const lineTotal = round2(total < lineSubtotal - 0.005 ? total : Math.max(0, lineSubtotal - alloc));
    return {
      lineId: l.id,
      variantId: l.merchandise.id,
      productId: l.merchandise.product.id.replace(/^gid:\/\/shopify\/Product\//, ""),
      productHandle: l.merchandise.product.handle,
      productTitle: l.merchandise.product.title,
      variantTitle: l.merchandise.title,
      imageUrl: l.merchandise.image?.url ?? l.merchandise.product.featuredImage?.url ?? null,
      price: l.merchandise.price,
      quantity: l.quantity,
      selectedOptions: l.merchandise.selectedOptions,
      lineTotal,
      lineSubtotal,
      lineDiscount: round2(lineSubtotal - lineTotal),
      attributes: toMap(l.attributes),
    };
  });
  const before = round2(lines.reduce((s, l) => s + l.lineSubtotal, 0));
  const after = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  return {
    id: c.id,
    checkoutUrl: formatCheckoutUrl(c.checkoutUrl),
    totalQuantity: c.totalQuantity,
    email: c.buyerIdentity?.email ?? null,
    attributes: toMap(c.attributes),
    discountCodes: c.discountCodes,
    currency: c.cost.subtotalAmount.currencyCode || "USD",
    merchandiseBeforeDiscounts: before,
    merchandiseAfterDiscounts: after,
    savings: round2(before - after),
    lines,
  };
}

export type CartWarning = { code: string; message: string };
export type CartResult =
  | { ok: true; cart: CartView; warnings: CartWarning[] }
  | { ok: false; notFound: boolean; errors: string[] };

/** Shopify warning code for a once-per-customer code this email already used. */
export const USED_CODE_WARNING = "DISCOUNT_CUSTOMER_USAGE_LIMIT_REACHED";
/** Warning codes that mean merchandise couldn't be added in full. */
export const STOCK_WARNINGS = ["MERCHANDISE_NOT_ENOUGH_STOCK", "MERCHANDISE_OUT_OF_STOCK", "PAYMENTS_GIFT_CARDS_UNAVAILABLE"];

// "Invalid global id" (a malformed saved cartId) is treated like a missing cart.
const NOT_FOUND_RE = /invalid global id|cart.*(not found|does not exist)|specified cart does not exist/i;

type UserError = { field: string[] | null; message: string; code?: string | null };

async function runCartMutation(
  name: string,
  mutation: string,
  variables: Record<string, unknown>,
): Promise<CartResult> {
  type Data = Record<string, { cart: RawCart | null; userErrors: UserError[]; warnings?: Array<{ code: string; message: string }> }>;
  let res: Awaited<ReturnType<typeof storefrontApiRequest<Data>>>;
  try {
    res = await storefrontApiRequest<Data>(mutation, variables);
  } catch (e) {
    const msg = (e as Error)?.message ?? String(e);
    return { ok: false, notFound: NOT_FOUND_RE.test(msg), errors: [msg] };
  }
  const payload = res?.data?.[name];
  const userErrors = payload?.userErrors ?? [];
  if (isCartNotFoundError(userErrors) || userErrors.some((e) => NOT_FOUND_RE.test(e.message))) {
    return { ok: false, notFound: true, errors: userErrors.map((e) => e.message) };
  }
  if (!payload?.cart) {
    return { ok: false, notFound: false, errors: userErrors.length ? userErrors.map((e) => e.message) : ["No cart returned"] };
  }
  if (userErrors.length) console.warn(`${name} userErrors`, userErrors);
  return {
    ok: true,
    cart: normalizeCart(payload.cart),
    warnings: [
      ...userErrors.map((e) => ({ code: e.code ?? "USER_ERROR", message: e.message })),
      ...(payload.warnings ?? []).map((w) => ({ code: w.code, message: w.message })),
    ],
  };
}

export type NewLine = {
  merchandiseId: string;
  quantity: number;
  attributes?: Array<{ key: string; value: string }>;
};

/** null = the cart is gone (completed, expired, or a malformed id). Throws only on network/server errors. */
export async function fetchCart(cartId: string): Promise<CartView | null> {
  try {
    const res = await storefrontApiRequest<{ cart: RawCart | null }>(
      `query cartFull($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
      { id: cartId },
    );
    const c = res?.data?.cart;
    return c ? normalizeCart(c) : null;
  } catch (e) {
    if (NOT_FOUND_RE.test((e as Error)?.message ?? "")) return null;
    throw e;
  }
}

export function cartCreateFull(input: {
  lines: NewLine[];
  discountCodes?: string[];
  email?: string | null;
  attributes?: Array<{ key: string; value: string }>;
}): Promise<CartResult> {
  const cartInput: Record<string, unknown> = { lines: input.lines };
  if (input.discountCodes?.length) cartInput.discountCodes = input.discountCodes;
  if (input.email) cartInput.buyerIdentity = { email: input.email };
  if (input.attributes?.length) cartInput.attributes = input.attributes;
  return runCartMutation(
    "cartCreate",
    `mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { input: cartInput },
  );
}

export function cartLinesAddFull(cartId: string, lines: NewLine[]): Promise<CartResult> {
  return runCartMutation(
    "cartLinesAdd",
    `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { cartId, lines },
  );
}

export function cartLinesUpdateFull(
  cartId: string,
  lines: Array<{ id: string; quantity: number; merchandiseId?: string; attributes?: Array<{ key: string; value: string }> }>,
): Promise<CartResult> {
  return runCartMutation(
    "cartLinesUpdate",
    `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { cartId, lines },
  );
}

export function cartLinesRemoveFull(cartId: string, lineIds: string[]): Promise<CartResult> {
  return runCartMutation(
    "cartLinesRemove",
    `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { cartId, lineIds },
  );
}

/** Replaces the cart's codes (Shopify codes here never combine: pass 0 or 1). */
export function cartDiscountCodesUpdateFull(cartId: string, discountCodes: string[]): Promise<CartResult> {
  return runCartMutation(
    "cartDiscountCodesUpdate",
    `mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
      cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { cartId, discountCodes },
  );
}

/** Sets the checkout email so Shopify prefills it (no second entry). */
export function cartBuyerIdentityUpdateFull(cartId: string, email: string): Promise<CartResult> {
  return runCartMutation(
    "cartBuyerIdentityUpdate",
    `mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { cartId, buyerIdentity: { email } },
  );
}

/** Replaces the cart attributes (they land on the order as "additional details"). */
export function cartAttributesUpdateFull(cartId: string, attributes: Array<{ key: string; value: string }>): Promise<CartResult> {
  return runCartMutation(
    "cartAttributesUpdate",
    `mutation cartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
      cartAttributesUpdate(cartId: $cartId, attributes: $attributes) { cart { ${CART_FIELDS} } userErrors { field message code } warnings { code message } }
    }`,
    { cartId, attributes },
  );
}
