// Sunrise-styled cart drawer + trigger button. Slides in from the right,
// uses cream + flavor-color palette to match the rest of the site.
// Wired to the Zustand cart store; checkout opens Shopify in a new tab.

import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import "./CartDrawer.css";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const items = useCartStore((s) => s.items);
  const isLoading = useCartStore((s) => s.isLoading);
  const isSyncing = useCartStore((s) => s.isSyncing);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getCheckoutUrl = useCartStore((s) => s.getCheckoutUrl);
  const syncCart = useCartStore((s) => s.syncCart);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + parseFloat(i.price.amount) * i.quantity,
    0
  );
  const currency = items[0]?.price.currencyCode || "USD";

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (url) {
      window.open(url, "_blank");
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="cart-trigger"
        onClick={() => setIsOpen(true)}
        aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? "" : "s"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
        {totalItems > 0 && <span className="cart-trigger-badge">{totalItems}</span>}
      </button>

      {isOpen && (
        <div className="cart-overlay" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {/* Drawer is always in the DOM so the slide-in/slide-out CSS transition
          on .cart-drawer { transform } can fire in both directions. Inline
          style is a defensive fallback — it guarantees position:fixed and
          the off-screen translate even if the route-scoped stylesheet that
          carries .cart-drawer hasn't loaded yet (or has been clobbered by a
          page-transition stylesheet swap). Without it, an unstyled <aside>
          would fall into the .nav-right flex flow and leak its content
          inline next to the SHOP button. The class-based transform still
          drives the animation; inline values just establish a safe baseline.
          Inline `transform` does win specificity-wise over the class rule,
          but since the inline value mirrors what the class would produce
          (translateX(100%) ↔ translateX(0)) and the `transition` property
          stays on the class, the animation behaves identically.            */}
      <aside
        className={`cart-drawer ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "100%",
          maxWidth: "420px",
          height: "100vh",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          zIndex: 9999,
        }}
      >
        <header className="cart-header">
          <h2 className="cart-title">Your Cart</h2>
          <button
            type="button"
            className="cart-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close cart"
          >
            ×
          </button>
        </header>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-title">Your cart is empty</p>
              <p className="cart-empty-sub">Pick a flavor — start with our seltzers.</p>
              <a
                href="/products"
                className="cart-empty-cta"
                onClick={() => setIsOpen(false)}
              >
                Browse Products
              </a>
            </div>
          ) : (
            <ul className="cart-items">
              {items.map((item) => (
                <li key={item.variantId} className="cart-item">
                  {item.imageUrl && (
                    <div className="cart-item-image">
                      <img src={item.imageUrl} alt={item.productTitle} />
                    </div>
                  )}
                  <div className="cart-item-body">
                    <div className="cart-item-title">{item.productTitle}</div>
                    <div className="cart-item-variant">{item.variantTitle}</div>
                    <div className="cart-item-price">
                      ${parseFloat(item.price.amount).toFixed(2)}
                    </div>
                    <div className="cart-item-qty">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        disabled={isLoading}
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                        disabled={isLoading}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Remove item"
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-footer">
            <div className="cart-total">
              <span>Subtotal</span>
              <span className="cart-total-amount">
                ${totalPrice.toFixed(2)} {currency}
              </span>
            </div>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={isLoading || isSyncing}
            >
              {isLoading || isSyncing ? "Updating…" : "Checkout →"}
            </button>
            <p className="cart-footer-note">
              Shipping &amp; taxes calculated at checkout.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}