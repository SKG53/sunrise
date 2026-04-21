// =============================================================================
// SUNRISE — Shopify integration test route
// Path: src/routes/shopify-test.tsx
// Session: SBev.BC.Shopify.1
//
// NOT a production route. This page exercises every piece of the Shopify
// integration against mock.shop:
//   - useProducts() renders the product list
//   - useAddToCart() wires the "Add to cart" button
//   - useCart() renders the cart state
//   - useUpdateCartLine() / useRemoveCartLine() wire the quantity controls
//   - checkoutUrl handoff is a simple window.location redirect
//
// When you point at a real Shopify store, this page validates the integration
// is working before you plug it into the real SUNRISE site components.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useAddToCart,
  useCart,
  useProducts,
  useRemoveCartLine,
  useUpdateCartLine,
} from "../hooks/shopify";
import { storefrontConfig, type Product } from "../lib/storefront";

export const Route = createFileRoute("/shopify-test")({
  component: ShopifyTestPage,
  head: () => ({
    meta: [
      { title: "Shopify Integration Test · SUNRISE" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

// ── HELPERS ──────────────────────────────────────────────────────────────

function formatMoney(amount: string, currencyCode: string): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return `${amount} ${currencyCode}`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currencyCode}`;
  }
}

// ── PAGE ─────────────────────────────────────────────────────────────────

function ShopifyTestPage() {
  const productsQuery = useProducts({ first: 8 });
  const cartQuery = useCart();

  return (
    <div
      style={{
        backgroundColor: "#FEFBE0",
        minHeight: "100vh",
        fontFamily: "Montserrat, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#2E1640",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Header />
        <ConfigBanner />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: 32,
            marginTop: 32,
            alignItems: "start",
          }}
        >
          <section>
            <SectionTitle>Products</SectionTitle>
            <ProductsGrid
              products={productsQuery.data ?? []}
              isLoading={productsQuery.isLoading}
              isError={productsQuery.isError}
              errorMessage={productsQuery.error?.message}
            />
          </section>

          <aside>
            <SectionTitle>Cart</SectionTitle>
            <CartPanel
              cart={cartQuery.cart}
              isLoading={cartQuery.isLoading}
              isEmpty={cartQuery.isEmpty}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── HEADER / CONFIG ──────────────────────────────────────────────────────

function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid #C4922A",
        paddingBottom: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#C4922A",
          fontWeight: 700,
        }}
      >
        SUNRISE · Brand Creative
      </div>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          marginTop: 6,
          marginBottom: 4,
        }}
      >
        Shopify Integration Test
      </h1>
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Exercises the full Storefront API integration end-to-end. Not a production page.
      </p>
    </header>
  );
}

function ConfigBanner() {
  return (
    <div
      style={{
        background: "rgba(196, 146, 42, 0.08)",
        borderLeft: "3px solid #C4922A",
        padding: "10px 14px",
        fontSize: 12,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      <div>
        <strong style={{ color: "#C4922A" }}>Endpoint:</strong>{" "}
        {storefrontConfig.apiUrl}
      </div>
      <div>
        <strong style={{ color: "#C4922A" }}>Auth token:</strong>{" "}
        {storefrontConfig.hasAccessToken ? "configured" : "none (mock.shop mode)"}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#C4922A",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

// ── PRODUCTS GRID ────────────────────────────────────────────────────────

interface ProductsGridProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

function ProductsGrid({
  products,
  isLoading,
  isError,
  errorMessage,
}: ProductsGridProps) {
  if (isLoading) return <Status>Loading products…</Status>;
  if (isError)
    return (
      <Status error>Error loading products: {errorMessage ?? "unknown"}</Status>
    );
  if (products.length === 0) return <Status>No products returned.</Status>;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const firstVariant = product.variants[0];
  const available = firstVariant?.availableForSale ?? false;

  return (
    <div
      style={{
        border: "1px solid rgba(46, 22, 64, 0.15)",
        borderRadius: 6,
        padding: 14,
        background: "#FEFBE0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {product.featuredImage?.url ? (
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText ?? product.title}
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            borderRadius: 4,
            marginBottom: 10,
            background: "rgba(46, 22, 64, 0.05)",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            aspectRatio: "1 / 1",
            background: "rgba(46, 22, 64, 0.05)",
            borderRadius: 4,
            marginBottom: 10,
          }}
        />
      )}

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {product.title}
      </div>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 10 }}>
        {formatMoney(
          product.priceRange.minVariantPrice.amount,
          product.priceRange.minVariantPrice.currencyCode,
        )}
      </div>

      <button
        type="button"
        disabled={!available || !firstVariant || addToCart.isPending}
        onClick={() =>
          firstVariant &&
          addToCart.mutate({ variantId: firstVariant.id, quantity: 1 })
        }
        style={{
          marginTop: "auto",
          padding: "8px 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#FEFBE0",
          background: available ? "#2E1640" : "rgba(46, 22, 64, 0.3)",
          border: "none",
          borderRadius: 4,
          cursor: available && !addToCart.isPending ? "pointer" : "not-allowed",
        }}
      >
        {addToCart.isPending
          ? "Adding…"
          : available
          ? "Add to cart"
          : "Sold out"}
      </button>

      {addToCart.isError && (
        <div style={{ fontSize: 10, color: "#CC1F39", marginTop: 6 }}>
          {addToCart.error.message}
        </div>
      )}
    </div>
  );
}

// ── CART PANEL ───────────────────────────────────────────────────────────

interface CartPanelProps {
  cart: ReturnType<typeof useCart>["cart"];
  isLoading: boolean;
  isEmpty: boolean;
}

function CartPanel({ cart, isLoading, isEmpty }: CartPanelProps) {
  if (isLoading) return <Status>Loading cart…</Status>;
  if (isEmpty || !cart) return <Status>Cart is empty.</Status>;

  return (
    <div
      style={{
        border: "1px solid rgba(46, 22, 64, 0.15)",
        borderRadius: 6,
        background: "#FEFBE0",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 2 }}>
          {cart.totalQuantity} {cart.totalQuantity === 1 ? "item" : "items"}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {formatMoney(
            cart.cost.subtotalAmount.amount,
            cart.cost.subtotalAmount.currencyCode,
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(46, 22, 64, 0.1)" }}>
        {cart.lines.map((line) => (
          <CartLineRow key={line.id} line={line} />
        ))}
      </div>

      <div style={{ padding: 14, borderTop: "1px solid rgba(46, 22, 64, 0.1)" }}>
        <a
          href={cart.checkoutUrl}
          style={{
            display: "block",
            textAlign: "center",
            padding: "10px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#FEFBE0",
            background: "#C4922A",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          Checkout
        </a>
        <div
          style={{
            fontSize: 10,
            opacity: 0.55,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          mock.shop checkout is a dead-end URL — this is expected.
        </div>
      </div>
    </div>
  );
}

function CartLineRow({ line }: { line: NonNullable<ReturnType<typeof useCart>["cart"]>["lines"][number] }) {
  const updateLine = useUpdateCartLine();
  const removeLine = useRemoveCartLine();
  const [localQty, setLocalQty] = useState(line.quantity);

  const busy = updateLine.isPending || removeLine.isPending;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "10px 14px",
        borderBottom: "1px solid rgba(46, 22, 64, 0.06)",
      }}
    >
      {line.merchandise.image?.url && (
        <img
          src={line.merchandise.image.url}
          alt={line.merchandise.image.altText ?? ""}
          style={{
            width: 48,
            height: 48,
            objectFit: "cover",
            borderRadius: 3,
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>
          {line.merchandise.product.title}
        </div>
        {line.merchandise.title !== "Default Title" && (
          <div style={{ fontSize: 10, opacity: 0.6 }}>
            {line.merchandise.title}
          </div>
        )}
        <div style={{ fontSize: 11, marginTop: 4 }}>
          {formatMoney(
            line.cost.totalAmount.amount,
            line.cost.totalAmount.currencyCode,
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <button
            type="button"
            disabled={busy || localQty <= 1}
            onClick={() => {
              const next = Math.max(1, localQty - 1);
              setLocalQty(next);
              updateLine.mutate({ lineId: line.id, quantity: next });
            }}
            style={qtyBtnStyle(busy || localQty <= 1)}
          >
            −
          </button>
          <span style={{ fontSize: 11, minWidth: 18, textAlign: "center" }}>
            {localQty}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const next = localQty + 1;
              setLocalQty(next);
              updateLine.mutate({ lineId: line.id, quantity: next });
            }}
            style={qtyBtnStyle(busy)}
          >
            +
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => removeLine.mutate({ lineId: line.id })}
            style={{
              marginLeft: "auto",
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#CC1F39",
              background: "none",
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
              padding: 0,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function qtyBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 22,
    height: 22,
    fontSize: 14,
    lineHeight: 1,
    color: "#2E1640",
    background: "rgba(46, 22, 64, 0.06)",
    border: "1px solid rgba(46, 22, 64, 0.15)",
    borderRadius: 3,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}

function Status({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      style={{
        padding: 20,
        border: "1px solid rgba(46, 22, 64, 0.15)",
        borderRadius: 6,
        fontSize: 12,
        color: error ? "#CC1F39" : "#2E1640",
        opacity: error ? 1 : 0.7,
        background: "#FEFBE0",
      }}
    >
      {children}
    </div>
  );
}
