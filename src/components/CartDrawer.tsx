// Sunrise cart drawer + trigger button (site pass 1, Oct 28 2026).
//
// Top to bottom:
//   1. Free-shipping bar ($74.50 live threshold, copy says $75) with an
//      unlocked state.
//   2. Deal meter for the active code (lib/deals.ts): progress toward the
//      requirement, "unlocked ✓" when done, and "add my free 4-pack" if the
//      shopper removed the auto-added free item.
//   3. Lines with Shopify's real totals. The auto-added free line shows FREE
//      and a flavor picker instead of the quantity stepper.
//   4. Totals: subtotal, "CODE applied · you save $X", total. Saved-code
//      switcher when the wallet holds more than one code.
//   5. Two buttons. "Continue Shopping" is the accent/primary (and focused)
//      until the cart is at free shipping AND no deal is mid-way; then
//      "Checkout" takes over. Checkout is always available.
//   6. Checkout email step (only when we don't know the shopper yet): email +
//      first/last name, then straight to Shopify with the email prefilled.
//
// Open state lives in the cart store, so Add to Cart anywhere opens it.
//
// The overlay + drawer render in a portal on <body>. Before, they rendered
// inside SiteHeader, whose z-index (50) capped the drawer below the sticky
// announcement bar (51), hiding the drawer's title and close button.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCartStore, dealLines, isFreeDeclined, type CartItem } from "@/stores/cartStore";
import { dealByCode, evaluateDeal, freeShipState, FREE_SHIP_LABEL } from "@/lib/deals";
import { getActiveCode, listWallet, setActiveCode, WALLET_EVENT, type WalletEntry } from "@/lib/dealWallet";
import { knownEmail, getIdentity } from "@/lib/identity";
import { FREE_10MG, LIVE_FOUR_PACKS, type FourPack } from "@/lib/liveFourPacks";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money = (n: number) => `$${n.toFixed(2)}`;

function useWallet(): { active: string | null; entries: WalletEntry[] } {
  const [state, setState] = useState<{ active: string | null; entries: WalletEntry[] }>({ active: null, entries: [] });
  useEffect(() => {
    const sync = () => setState({ active: getActiveCode(), entries: listWallet() });
    sync();
    window.addEventListener(WALLET_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WALLET_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return state;
}

const packLabel = (p: FourPack) => `${p.flavor} · ${p.tier}mg${p.cannabinoid ? ` +${p.cannabinoid}` : ""}`;

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const openCart = useCartStore((s) => s.openCart);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const cart = useCartStore((s) => s.cart);
  const isLoading = useCartStore((s) => s.isLoading);
  const isSyncing = useCartStore((s) => s.isSyncing);
  const isCheckingOut = useCartStore((s) => s.isCheckingOut);
  const storeError = useCartStore((s) => s.error);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const swapFreeItem = useCartStore((s) => s.swapFreeItem);
  const restoreFreeItem = useCartStore((s) => s.restoreFreeItem);
  const syncCart = useCartStore((s) => s.syncCart);
  const checkout = useCartStore((s) => s.checkout);
  const { active, entries } = useWallet();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [step, setStep] = useState<"cart" | "email">("cart");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailError, setEmailError] = useState("");
  const primaryRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const before = cart?.merchandiseBeforeDiscounts ?? items.reduce((s, i) => s + Number(i.price.amount) * i.quantity, 0);
  const after = cart?.merchandiseAfterDiscounts ?? before;
  const savings = Math.max(0, Math.round((before - after) * 100) / 100);
  const currency = cart?.currency ?? items[0]?.price.currencyCode ?? "USD";

  const rule = dealByCode(active);
  const ev = useMemo(() => evaluateDeal(rule, dealLines(items), isFreeDeclined(active)), [rule, items, active]);
  const ship = freeShipState(after);
  const appliedCode = cart?.discountCodes.find((d) => active && d.code.toUpperCase() === active.toUpperCase());
  const checkoutPrimary = ship.unlocked && ev.status !== "progress";
  const busy = isLoading || isSyncing;

  useEffect(() => {
    if (!isOpen) return;
    syncCart();
    setStep("cart");
  }, [isOpen, syncCart]);

  // Body scroll lock + Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  // Focus the primary button when the drawer opens / the primary flips.
  useEffect(() => {
    if (isOpen && step === "cart" && items.length) {
      const t = window.setTimeout(() => primaryRef.current?.focus({ preventScroll: true }), 320);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, step, checkoutPrimary, items.length]);

  const onCheckout = () => {
    if (knownEmail()) {
      checkout();
      return;
    }
    const id = getIdentity();
    setFirstName(id?.firstName ?? "");
    setLastName(id?.lastName ?? "");
    setStep("email");
    window.setTimeout(() => emailRef.current?.focus(), 30);
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 320) {
      setEmailError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setEmailError("");
    // Profile upsert (names, no subscribe) — fire-and-forget, never blocks.
    fetch("/api/public/checkout-identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        email: value,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        capture_page: `${location.host.replace(/^www\./, "")}${location.pathname}`,
      }),
    }).catch(() => {});
    checkout({ email: value, firstName, lastName });
  };

  const freePool = rule?.kind === "bxgy" && rule.getScope.tiers.length === 1 && rule.getScope.tiers[0] === 10 ? FREE_10MG : LIVE_FOUR_PACKS;

  const renderItem = (item: CartItem) => {
    const isFree = !!item.freeFor;
    const lineSubtotal = Number(item.price.amount) * item.quantity;
    // Lines show list price; the savings show once, in the totals. (Shopify
    // may put a buy-X-get-Y discount on ANY matching line, e.g. the paid
    // pack of the same flavor, so per-line discounts would confuse.) The
    // free line reads FREE once Shopify confirms the code applies.
    const freeNow = isFree && ev.status === "complete" && !!appliedCode?.applicable;
    return (
      <li key={item.lineId ?? item.variantId} className={`cart-item${isFree ? " is-free" : ""}`}>
        <div className="cart-item-image">
          {item.imageUrl && <img src={item.imageUrl} alt={item.productTitle} />}
        </div>
        <div className="cart-item-body">
          <div className="cart-item-title">{item.productTitle}</div>
          <div className="cart-item-variant">{item.variantTitle}</div>
          <div className="cart-item-price">
            {freeNow && <s className="cart-item-was">{money(lineSubtotal)}</s>}
            <span>{freeNow ? "FREE" : money(lineSubtotal)}</span>
          </div>
          {isFree ? (
            <label className="cart-free-swap">
              <span className="cart-free-badge">Free with {item.freeFor}</span>
              <select
                value={item.variantId}
                disabled={busy}
                onChange={(e) => item.lineId && swapFreeItem(item.lineId, e.target.value)}
                aria-label="Choose your free 4-pack"
              >
                {freePool.map((p) => (
                  <option key={p.variantId} value={p.variantId}>
                    {packLabel(p)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="cart-item-qty">
              <button
                type="button"
                className="cart-qty-btn"
                onClick={() => item.lineId && updateQuantity(item.lineId, item.quantity - 1)}
                aria-label="Decrease quantity"
                disabled={busy}
              >
                −
              </button>
              <span className="cart-qty-value">{item.quantity}</span>
              <button
                type="button"
                className="cart-qty-btn"
                onClick={() => item.lineId && updateQuantity(item.lineId, item.quantity + 1)}
                aria-label="Increase quantity"
                disabled={busy}
              >
                +
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          className="cart-item-remove"
          onClick={() => item.lineId && removeItem(item.lineId)}
          aria-label={isFree ? "Remove free item" : "Remove item"}
          disabled={busy}
        >
          Remove
        </button>
      </li>
    );
  };

  return (
    <>
      <button
        type="button"
        className="cart-trigger"
        onClick={openCart}
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

      {mounted && createPortal(<>
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={closeCart}
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(44, 24, 16, 0.45)", zIndex: 9998 }}
        />
      )}

      {/* Always in the DOM so the slide transition runs both ways. Inline
          style is the defensive baseline kept from the previous drawer (see
          git history): position/translate even if the stylesheet is late. */}
      <aside
        className={`cart-drawer ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "100%",
          maxWidth: "420px",
          height: "100dvh",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          zIndex: 9999,
          background: "#f7efe0",
        }}
      >
        <header className="cart-header">
          <h2 className="cart-title">Your Cart</h2>
          <button type="button" className="cart-close" onClick={closeCart} aria-label="Close cart">
            ×
          </button>
        </header>

        {items.length > 0 && (
          <div className="cart-meters" aria-live="polite">
            <div className={`cart-ship${ship.unlocked ? " is-unlocked" : ""}`}>
              <p className="cart-ship-text">
                {ship.unlocked ? (
                  <>
                    <span aria-hidden="true">🎉 </span>You unlocked <strong>free shipping</strong>
                  </>
                ) : (
                  <>
                    You're <strong>{money(ship.away)}</strong> away from free shipping
                  </>
                )}
              </p>
              <div className="cart-meter" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_SHIP_LABEL} aria-valuenow={Math.min(after, FREE_SHIP_LABEL)} aria-label="Progress to free shipping">
                <span style={{ width: `${Math.round(ship.fill * 100)}%` }} />
              </div>
            </div>

            {rule && ev.status !== "none" && (
              <div className={`cart-deal is-${ev.status}`}>
                <p className="cart-deal-label">
                  <span className="cart-deal-code">{rule.code}</span> {rule.label}
                </p>
                {ev.status === "progress" && ev.need > 1 && (
                  <div className="cart-meter is-deal" role="progressbar" aria-valuemin={0} aria-valuemax={ev.need} aria-valuenow={Math.min(ev.have, ev.need)} aria-label="Deal progress">
                    <span style={{ width: `${Math.round(Math.min(ev.have / ev.need, 1) * 100)}%` }} />
                  </div>
                )}
                <p className="cart-deal-msg">{ev.message}</p>
                {ev.status === "progress" && isFreeDeclined(active) && rule.kind === "bxgy" && (
                  <button type="button" className="cart-deal-add" onClick={restoreFreeItem} disabled={busy}>
                    Add my free 4-pack
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-title">Your cart is empty</p>
              <p className="cart-empty-sub">Pick a flavor - start with our seltzers.</p>
              {active && rule && (
                <p className="cart-empty-sub">
                  Your code <strong>{rule.code}</strong> is saved and will apply automatically.
                </p>
              )}
              <a href="/products" className="cart-empty-cta" onClick={closeCart}>
                Browse Products
              </a>
            </div>
          ) : (
            <ul className="cart-items">{items.map(renderItem)}</ul>
          )}
        </div>

        {items.length > 0 && step === "cart" && (
          <footer className="cart-footer">
            <div className="cart-row">
              <span>Subtotal</span>
              <span>{money(before)}</span>
            </div>
            {active && rule && (
              <div className={`cart-row cart-code${appliedCode?.applicable ? " is-applied" : ""}`}>
                <span>
                  <strong>{rule.code}</strong>{" "}
                  {appliedCode?.applicable && savings > 0 ? (
                    <>applied · you save {money(savings)}</>
                  ) : (
                    <>saved · applies when your cart qualifies</>
                  )}
                </span>
                {appliedCode?.applicable && savings > 0 && <span>−{money(savings)}</span>}
              </div>
            )}
            {entries.length > 1 && (
              <label className="cart-code-switch">
                <span>Your codes:</span>
                <select value={active ?? ""} onChange={(e) => setActiveCode(e.target.value || null)} disabled={busy}>
                  {entries.map((en) => (
                    <option key={en.code} value={en.code}>
                      {en.code} · {dealByCode(en.code)?.label}
                    </option>
                  ))}
                  <option value="">No code</option>
                </select>
              </label>
            )}
            {entries.length === 1 && active && (
              <button type="button" className="cart-code-remove" onClick={() => setActiveCode(null)} disabled={busy}>
                Remove code
              </button>
            )}
            {entries.length === 1 && !active && (
              <button type="button" className="cart-code-remove" onClick={() => setActiveCode(entries[0].code)} disabled={busy}>
                Use my code {entries[0].code}
              </button>
            )}
            <div className="cart-total">
              <span>Total</span>
              <span className="cart-total-amount">
                {money(after)} {currency}
              </span>
            </div>

            <div className={`cart-actions${checkoutPrimary ? " checkout-first" : ""}`}>
              <button
                ref={checkoutPrimary ? undefined : primaryRef}
                type="button"
                className={`cart-btn ${checkoutPrimary ? "is-secondary" : "is-primary"}`}
                onClick={closeCart}
              >
                Continue Shopping
              </button>
              <button
                ref={checkoutPrimary ? primaryRef : undefined}
                type="button"
                className={`cart-btn ${checkoutPrimary ? "is-primary" : "is-secondary"}`}
                onClick={onCheckout}
                disabled={busy || isCheckingOut}
              >
                {isCheckingOut ? "Opening checkout…" : busy ? "Updating…" : "Checkout"}
              </button>
            </div>
            {(storeError) && <p className="cart-error">{storeError}</p>}
            <p className="cart-footer-note">
              {ship.unlocked ? "Free shipping · taxes calculated at checkout." : "Shipping & taxes calculated at checkout."}
            </p>
          </footer>
        )}

        {items.length > 0 && step === "email" && (
          <footer className="cart-footer">
            <form className="cart-email" onSubmit={onEmailSubmit} noValidate>
              <p className="cart-email-title">Where should we send your order updates?</p>
              <label className="cart-field">
                <span>Email</span>
                <input
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                />
              </label>
              <div className="cart-field-row">
                <label className="cart-field">
                  <span>First name</span>
                  <input type="text" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </label>
                <label className="cart-field">
                  <span>Last name</span>
                  <input type="text" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </label>
              </div>
              {emailError && <p className="cart-error">{emailError}</p>}
              {storeError && <p className="cart-error">{storeError}</p>}
              <button type="submit" className="cart-btn is-primary" disabled={isCheckingOut || busy}>
                {isCheckingOut ? "Opening checkout…" : "Continue to Checkout"}
              </button>
              <button type="button" className="cart-email-back" onClick={() => setStep("cart")}>
                Back to cart
              </button>
              <p className="cart-footer-note">We'll fill this in at checkout so you don't type it twice.</p>
            </form>
          </footer>
        )}
      </aside>
      </>, document.body)}
    </>
  );
}
