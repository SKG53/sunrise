// =============================================================================
// SUNRISE — Storefront API types
// Path: src/lib/storefront/types.ts
// Session: SBev.BC.Shopify.1
//
// Typed subset of Shopify Storefront API 2024-10 covering products and cart.
// Not exhaustive — add fields as the site needs them.
// =============================================================================

// ── MONEY ────────────────────────────────────────────────────────────────
export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

// ── IMAGE ────────────────────────────────────────────────────────────────
export interface StorefrontImage {
  id: string | null;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

// ── PRODUCT ──────────────────────────────────────────────────────────────
export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  price: MoneyV2;
  image: StorefrontImage | null;
  selectedOptions: Array<{ name: string; value: string }>;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  featuredImage: StorefrontImage | null;
  images: StorefrontImage[];
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: MoneyV2;
    maxVariantPrice: MoneyV2;
  };
}

// ── CART ─────────────────────────────────────────────────────────────────
export interface CartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: MoneyV2;
    subtotalAmount: MoneyV2;
  };
  merchandise: {
    id: string;
    title: string;
    availableForSale: boolean;
    price: MoneyV2;
    image: StorefrontImage | null;
    product: {
      id: string;
      handle: string;
      title: string;
    };
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
    totalTaxAmount: MoneyV2 | null;
  };
  lines: CartLine[];
}

// ── RESPONSE WRAPPERS ────────────────────────────────────────────────────
// These match the shape Shopify actually returns — with edges/nodes pagination
// on list connections. The query selection flattens these in our query docs,
// so the types below describe the post-flattening shape.

export interface ProductByHandleResponse {
  product: Product | null;
}

export interface ProductsResponse {
  products: {
    edges: Array<{ node: Product }>;
  };
}

export interface CartResponse {
  cart: Cart | null;
}

export interface CartMutationResponse {
  cart: Cart;
  userErrors: Array<{ field: string[] | null; message: string }>;
}