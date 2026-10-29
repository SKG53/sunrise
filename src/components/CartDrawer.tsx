// Sunrise cart drawer + trigger button (site pass 2, Oct 29 2026).
//
// One cart, many views: this drawer and every Build Your Box page show the
// same cart (stores/cartStore.ts).
//
// Top to bottom:
//   0. Notices (no silent changes) and the "One deal per order. Which one?"
//      chooser (lib/dealWallet.ts).
//   1. Free-shipping bar: gold while in progress, green when unlocked
//      ($74.50 live threshold after discounts; copy says $75).
//   2. Deal block: the DEAL leads ("Buy 4, get 1 free"), the code is small and
//      secondary. Progress meter while mid-way; one line once unlocked.
//   3. Lines: "$28.95 × 4" plus the line total. "Includes 1 free" sits on
//      whichever line Shopify actually discounted. The auto-added free pack
//      has a flavor picker limited to packs Shopify will free (≤ the cheapest
//      paid pack). Before a − or Remove would lose the free pack, the line asks.
//   4. Totals, "Your deals" switcher, and a foreign-code offer.
//   5. Buttons: "Continue Shopping" is primary (red, focused on open) until the
//      cart is at free shipping AND no deal is mid-way; then "Checkout" leads.
//      Checkout is always available. Under 480 px the secondary one is a link.
//   6. Email step (unknown shoppers only): EMAIL ONLY (founder). Known shoppers
//      see "Checking out as" / their FULL email in bold on its own line /
//      "Not you?" (founder, Oct 29: full address, not masked).
//   7. "N more items below" pill when cart lines are hidden under the fold
//      (Oct 29); tap scrolls the next hidden line into view.
//
// Renders in a portal on <body> (z-index fix: SiteHeader's stacking context
// used to put the drawer under the announcement bar). Focus is trapped while
// open; the drawer is inert when closed; focus returns to the cart button.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCartStore, dealLines, isFreeDeclined, freePriceCap, type CartItem } from "@/stores/cartStore";
import { dealByCode, evaluateDeal, freeShipState, wouldLoseFree, FREE_SHIP_LABEL } from "@/lib/deals";
import {
  dismissChoice,
  getActiveCode,
  getChoice,
  listWallet,
  setActiveCode,
  takeNotices,
  WALLET_EVENT,
  type WalletChoice,
  type WalletEntry,
} from "@/lib/dealWallet";
import { clearIdentityEmail, knownEmail, subscribeIdentity } from "@/lib/identity";
import { FREE_10MG, LIVE_FOUR_PACKS, type FourPack } from "@/lib/liveFourPacks";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money = (n: number) => `$${n.toFixed(2)}`;

type WalletState = { active: string | null; entries: WalletEntry[]; choice: WalletChoice | null; notices: string[] };
function useWallet(): WalletState {
  const [state, setState] = useState<WalletState>({ active: null, entries: [], choice: null, notices: [] });
  useEffect(() => {
    const sync = () =>
      setState({ active: getActiveCode(), entries: listWallet(), choice: getChoice(), notices: takeNotices(false) });
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

function useKnownEmail(): string | null {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    setEmail(knownEmail());
    return subscribeIdentity(() => setEmail(knownEmail()));
  }, []);
  return email;
}

const packLabel = (p: FourPack) => `${p.flavor} · ${p.tier}mg${p.cannabinoid ? ` +${p.cannabinoid}` : ""}`;
const dealLabel = (code: string | null) => dealByCode(code)?.label ?? code ?? "";

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
  const foreignCode = useCartStore((s) => s.foreignCode);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const swapFreeItem = useCartStore((s) => s.swapFreeItem);
  const restoreFreeItem = useCartStore((s) => s.restoreFreeItem);
  const useSavedDeal = useCartStore((s) => s.useSavedDeal);
  const syncCart = useCartStore((s) => s.syncCart);
  const checkout = useCartStore((s) => s.checkout);
  const { active, entries, choice, notices } = useWallet();
  const email = useKnownEmail();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [step, setStep] = useState<"cart" | "email">("cart");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [confirm, setConfirm] = useState<{ lineId: string; qty: number } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const asideRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const wasOpen = useRef(false);

  // "More below" cue (Oct 29): when cart lines are hidden under the fold, a
  // pill sits at the bottom of the list ("2 more items below"); tapping it
  // scrolls the next hidden line into view. Works with either scroller: the
  // list itself (normal) or the whole panel (short screens, max-height 700px).
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [below, setBelow] = useState(0);
  const MORE_CLEARANCE = 56; // px kept clear above the pill when scrolling
  const listView = useCallback(() => {
    const body = bodyRef.current;
    const scroller = scrollRef.current;
    if (!body || !scroller) return null;
    const bottom = Math.min(body.getBoundingClientRect().bottom, scroller.getBoundingClientRect().bottom);
    const rows = Array.from(body.querySelectorAll<HTMLElement>(".cart-items > li"));
    // A line counts as "below" when less than half of it (max 40px) shows
    // above the pill's zone at the bottom of the list.
    const hidden = rows.filter((li) => {
      const r = li.getBoundingClientRect();
      return r.top + Math.min(r.height / 2, 40) > bottom - 48;
    });
    const el = body.scrollHeight > body.clientHeight + 1 ? body : scroller;
    return { bottom, hidden, el };
  }, []);
  useEffect(() => {
    if (!isOpen || step !== "cart" || items.length === 0) {
      setBelow(0);
      return;
    }
    const body = bodyRef.current;
    const scroller = scrollRef.current;
    if (!body || !scroller) return;
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setBelow(listView()?.hidden.length ?? 0));
    };
    measure();
    const t = window.setTimeout(measure, 350); // after the slide-in
    body.addEventListener("scroll", measure, { passive: true });
    scroller.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(body);
    ro?.observe(scroller);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      body.removeEventListener("scroll", measure);
      scroller.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [isOpen, step, items, listView]);
  const showMore = () => {
    const v = listView();
    const next = v?.hidden[0];
    if (!v || !next) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const delta = next.getBoundingClientRect().bottom - v.bottom + MORE_CLEARANCE;
    v.el.scrollBy({ top: Math.max(delta, 0), behavior: reduce ? "auto" : "smooth" });
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const before = cart?.merchandiseBeforeDiscounts ?? items.reduce((s, i) => s + Number(i.price.amount) * i.quantity, 0);
  const after = cart?.merchandiseAfterDiscounts ?? before;
  const savings = Math.max(0, Math.round((before - after) * 100) / 100);
  const currency = cart?.currency ?? items[0]?.price.currencyCode ?? "USD";

  const rule = dealByCode(active);
  const lines = useMemo(() => dealLines(items), [items]);
  const declined = isFreeDeclined(cart?.id ?? null, active);
  const ev = useMemo(() => evaluateDeal(rule, lines, declined), [rule, lines, declined]);
  const ship = freeShipState(after);
  const appliedCode = cart?.discountCodes.find((d) => active && d.code.toUpperCase() === active.toUpperCase());
  const applies = !!appliedCode?.applicable && savings > 0;
  const checkoutPrimary = ship.unlocked && !ev.blocking;
  const busy = isLoading || isSyncing;
  const cap = freePriceCap(rule, items);
  const freePool = (rule?.kind === "bxgy" && rule.getScope.tiers.length === 1 && rule.getScope.tiers[0] === 10 ? FREE_10MG : LIVE_FOUR_PACKS).filter(
    (p) => p.fallbackPrice <= cap + 0.001,
  );

  // Where to show "Free": Shopify frees whole units of the cheapest qualifying
  // price, but with identical prices it may put the discount on a PAID line of
  // the same price instead of the one we marked. The money is identical, so
  // free units are counted per unit price and shown on our marked line first,
  // then on other lines of that price. Line totals follow, and still add up to
  // Shopify's total exactly. Percent codes keep Shopify's own line totals and
  // never show "Free" (fix Oct 29: 25% off five of one flavor = 1.25 packs of
  // discount, which read as "Includes 1 free").
  const freeKind = rule?.kind === "bxgy" || rule?.kind === "freeCan";
  const display = useMemo(() => {
    const out = new Map<string, { freeUnits: number; total: number }>();
    if (!freeKind) {
      items.forEach((i) => {
        const total = i.lineTotal ?? Number(i.price.amount) * i.quantity;
        out.set(i.lineId ?? i.variantId, { freeUnits: 0, total: Math.max(0, Math.round(total * 100) / 100) });
      });
      return out;
    }
    const byPrice = new Map<string, CartItem[]>();
    items.forEach((i) => {
      const k = Number(i.price.amount).toFixed(2);
      byPrice.set(k, [...(byPrice.get(k) ?? []), i]);
    });
    byPrice.forEach((group, k) => {
      const unit = Number(k);
      const freeTotal =
        unit > 0 ? group.reduce((n, i) => n + Math.floor(((i.lineDiscount ?? 0) + 0.005) / unit), 0) : 0;
      let left = freeTotal;
      const ordered = [...group].sort((a, b) => Number(!!b.freeFor) - Number(!!a.freeFor));
      ordered.forEach((i) => {
        const id = i.lineId ?? i.variantId;
        const units = Math.min(left, i.quantity);
        left -= units;
        const residual = Math.max(0, (i.lineDiscount ?? 0) - Math.floor(((i.lineDiscount ?? 0) + 0.005) / (unit || 1)) * unit);
        const total = freeTotal > 0 ? (i.quantity - units) * unit - residual : (i.lineTotal ?? unit * i.quantity);
        out.set(id, { freeUnits: units, total: Math.max(0, Math.round(total * 100) / 100) });
      });
    });
    return out;
  }, [items, freeKind]);

  useEffect(() => {
    if (!isOpen) return;
    syncCart();
    setStep("cart");
    setConfirm(null);
  }, [isOpen, syncCart]);

  useEffect(() => setPicked(choice?.preselect ?? null), [choice]);

  const close = useCallback(() => {
    takeNotices(true);
    window.dispatchEvent(new CustomEvent(WALLET_EVENT));
    closeCart();
  }, [closeCart]);

  // Open/close: scroll lock, Esc, focus trap, focus in on open, focus back on close.
  useEffect(() => {
    if (!isOpen) {
      if (wasOpen.current) triggerRef.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    const firstOpen = !wasOpen.current;
    wasOpen.current = true;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !asideRef.current) return;
      const f = Array.from(
        asideRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    // Focus only when the drawer OPENS (not when lines change underneath).
    const t = firstOpen
      ? window.setTimeout(() => (primaryRef.current ?? asideRef.current)?.focus({ preventScroll: true }), 320)
      : undefined;
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
      if (t) window.clearTimeout(t);
    };
  }, [isOpen, close]);

  const onCheckout = () => {
    if (knownEmail()) {
      checkout();
      return;
    }
    setStep("email");
    window.setTimeout(() => emailRef.current?.focus(), 30);
  };

  const notYou = () => {
    clearIdentityEmail();
    setEmailInput("");
    setStep("email");
    window.setTimeout(() => emailRef.current?.focus(), 30);
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = emailInput.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 320) {
      setEmailError("Please enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setEmailError("");
    checkout({ email: value });
  };

  // − / Remove that would cost the free pack: ask first (no silent changes).
  const changeQty = (item: CartItem, qty: number) => {
    if (!item.lineId) return;
    if (wouldLoseFree(rule, lines, item.lineId, qty)) {
      setConfirm({ lineId: item.lineId, qty });
      return;
    }
    if (qty <= 0) removeItem(item.lineId);
    else updateQuantity(item.lineId, qty);
  };

  const renderItem = (item: CartItem) => {
    const unit = Number(item.price.amount);
    const d = display.get(item.lineId ?? item.variantId);
    const lineTotal = d?.total ?? item.lineTotal ?? unit * item.quantity;
    const freeUnits = d?.freeUnits ?? 0;
    const isOursFree = !!item.freeFor;
    const asking = confirm && confirm.lineId === item.lineId;
    return (
      <li key={item.lineId ?? item.variantId} className={`cart-item${isOursFree ? " is-free" : ""}`}>
        <div className="cart-item-image">{item.imageUrl && <img src={item.imageUrl} alt={item.productTitle} />}</div>
        <div className="cart-item-body">
          <div className="cart-item-title">{item.productTitle}</div>
          <div className="cart-item-variant">{item.variantTitle}</div>
          <div className="cart-item-price">
            <span className="cart-item-unit">
              {money(unit)} × {item.quantity}
            </span>
            {freeUnits > 0 && (
              <span className="cart-free-badge">{freeUnits === item.quantity ? "Free" : `Includes ${freeUnits} free`}</span>
            )}
          </div>
          {isOursFree ? (
            <label className="cart-free-swap">
              <span className="cart-free-label">Your free 4-pack · pick a flavor</span>
              <select
                value={item.variantId}
                disabled={busy}
                onChange={(e) => item.lineId && swapFreeItem(item.lineId, e.target.value)}
                aria-label="Choose your free 4-pack"
              >
                {freePool.some((p) => p.variantId === item.variantId) ? null : (
                  <option value={item.variantId}>{item.productTitle}</option>
                )}
                {freePool.map((p) => (
                  <option key={p.variantId} value={p.variantId}>
                    {packLabel(p)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="cart-item-qty">
              <button type="button" className="cart-qty-btn" onClick={() => changeQty(item, item.quantity - 1)} aria-label="Decrease quantity" disabled={busy}>
                −
              </button>
              <span className="cart-qty-value">{item.quantity}</span>
              <button type="button" className="cart-qty-btn" onClick={() => changeQty(item, item.quantity + 1)} aria-label="Increase quantity" disabled={busy}>
                +
              </button>
            </div>
          )}
          {asking && (
            <div className="cart-confirm" role="alert">
              <p>This also removes your free 4-pack. {confirm.qty <= 0 ? "Remove anyway?" : "Continue?"}</p>
              <div>
                <button
                  type="button"
                  className="cart-confirm-yes"
                  onClick={() => {
                    const c = confirm;
                    setConfirm(null);
                    if (c.qty <= 0) removeItem(c.lineId);
                    else updateQuantity(c.lineId, c.qty);
                  }}
                >
                  {confirm.qty <= 0 ? "Remove" : "Yes, update"}
                </button>
                <button type="button" className="cart-confirm-no" onClick={() => setConfirm(null)}>
                  Keep my deal
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="cart-item-side">
          <span className="cart-item-total">{money(lineTotal)}</span>
          <button
            type="button"
            className="cart-item-remove"
            onClick={() => (isOursFree ? item.lineId && removeItem(item.lineId) : changeQty(item, 0))}
            aria-label={isOursFree ? "Remove free item" : "Remove item"}
            disabled={busy}
          >
            Remove
          </button>
        </div>
      </li>
    );
  };

  const dealBlock =
    rule && ev.status !== "none" ? (
      ev.status === "complete" ? (
        <p className="cart-deal is-complete">
          <strong>{rule.label} ✓</strong> <span className="cart-deal-code">code {rule.code}</span>
        </p>
      ) : (
        <div className={`cart-deal is-${ev.status}`}>
          <p className="cart-deal-label">
            <strong>{rule.label}</strong> <span className="cart-deal-code">code {rule.code}</span>
          </p>
          {ev.status === "progress" && ev.need > 1 && (
            <div className="cart-meter is-deal" role="progressbar" aria-valuemin={0} aria-valuemax={ev.need} aria-valuenow={Math.min(ev.have, ev.need)} aria-label="Deal progress">
              <span style={{ width: `${Math.round(Math.min(ev.have / ev.need, 1) * 100)}%` }} />
            </div>
          )}
          <p className="cart-deal-msg">{ev.message}</p>
          {ev.status === "progress" && declined && ev.qualifies && rule.kind === "bxgy" && (
            <button type="button" className="cart-deal-add" onClick={restoreFreeItem} disabled={busy}>
              Add my free 4-pack
            </button>
          )}
        </div>
      )
    ) : null;

  const drawer = (
    <>
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={close}
          aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(26, 26, 26, 0.45)", zIndex: 9998 }}
        />
      )}
      <aside
        ref={asideRef}
        className={`cart-drawer ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        inert={!isOpen}
        tabIndex={-1}
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
          <button type="button" className="cart-close" onClick={close} aria-label="Close cart">
            ×
          </button>
        </header>

        <div className="cart-scroll" ref={scrollRef}>
          {(notices.length > 0 || choice) && (
            <div className="cart-notices" aria-live="polite">
              {notices.map((n) => (
                <p key={n} className="cart-notice">
                  {n}
                </p>
              ))}
              {choice && (
                <form
                  className="cart-choice"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setActiveCode(picked ?? choice.preselect);
                  }}
                >
                  <p className="cart-choice-title">One deal per order. Which one?</p>
                  {choice.codes.map((c) => (
                    <label key={c} className="cart-choice-opt">
                      <input type="radio" name="cart-deal-choice" value={c} checked={(picked ?? choice.preselect) === c} onChange={() => setPicked(c)} />
                      <span>{dealLabel(c)}</span>
                    </label>
                  ))}
                  <div className="cart-choice-actions">
                    <button type="submit" className="cart-btn is-primary cart-btn-sm">
                      Use this deal
                    </button>
                    <button type="button" className="cart-email-back" onClick={dismissChoice}>
                      Decide later
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="cart-meters" aria-live="polite">
              <div className={`cart-ship${ship.unlocked ? " is-unlocked" : ""}`}>
                <p className="cart-ship-text">
                  {ship.unlocked ? (
                    <strong>Free shipping unlocked ✓</strong>
                  ) : (
                    <>
                      You're <strong>{money(ship.away)}</strong> away from free shipping
                    </>
                  )}
                </p>
                <div
                  className="cart-meter"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={FREE_SHIP_LABEL}
                  aria-valuenow={Math.min(after, FREE_SHIP_LABEL)}
                  aria-label="Progress to free shipping"
                >
                  <span style={{ width: `${Math.round(ship.fill * 100)}%` }} />
                </div>
              </div>
              {dealBlock}
            </div>
          )}

          <div className="cart-body" ref={bodyRef}>
            {items.length === 0 ? (
              <div className="cart-empty">
                <p className="cart-empty-title">Your cart is empty</p>
                <p className="cart-empty-sub">Pick a flavor - start with our seltzers.</p>
                {rule && (
                  <p className="cart-empty-sub">
                    Your deal, <strong>{rule.label}</strong>, is saved and applies automatically.
                  </p>
                )}
                <a href={rule?.boxPath ?? "/products"} className="cart-empty-cta" onClick={close}>
                  {rule?.boxPath ? "Build Your Box" : "Browse Products"}
                </a>
              </div>
            ) : (
              <ul className="cart-items">{items.map(renderItem)}</ul>
            )}
            {below > 0 && (
              <div className="cart-more">
                <span className="cart-more-fade" aria-hidden="true" />
                <button
                  type="button"
                  className="cart-more-btn"
                  onClick={showMore}
                  aria-label={`Scroll to see ${below} more item${below === 1 ? "" : "s"} in your cart`}
                >
                  {below} more item{below === 1 ? "" : "s"} below
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                    <path d="M2 4.25 6 8.25 10 4.25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {items.length > 0 && step === "cart" && (
            <footer className="cart-footer">
              <div className="cart-row">
                <span>Subtotal</span>
                <span>{money(before)}</span>
              </div>
              {foreignCode && (
                <div className="cart-row cart-code">
                  <span>
                    Code {foreignCode} is on your cart.
                    {rule && (
                      <>
                        {" "}
                        <button type="button" className="cart-code-remove" onClick={() => useSavedDeal()} disabled={busy}>
                          Use your deal ({rule.label}) instead
                        </button>
                      </>
                    )}
                  </span>
                </div>
              )}
              {!foreignCode && rule && (
                <div className={`cart-row cart-code${applies ? " is-applied" : ""}`}>
                  <span className="cart-code-text">
                    {rule.label} <span className="cart-deal-code">· code {rule.code}</span>
                    {!applies && <span className="cart-code-hint"> · applies when your cart qualifies</span>}
                  </span>
                  {applies && <span>−{money(savings)}</span>}
                </div>
              )}
              {entries.length > 1 && (
                <label className="cart-code-switch">
                  <span>Your deals:</span>
                  <select value={active ?? ""} onChange={(e) => setActiveCode(e.target.value || null)} disabled={busy}>
                    {entries.map((en) => (
                      <option key={en.code} value={en.code}>
                        {dealLabel(en.code)}
                      </option>
                    ))}
                    <option value="">No deal</option>
                  </select>
                </label>
              )}
              {entries.length === 1 && active && (
                <button type="button" className="cart-code-remove" onClick={() => setActiveCode(null)} disabled={busy}>
                  Remove deal
                </button>
              )}
              {entries.length === 1 && !active && (
                <button type="button" className="cart-code-remove" onClick={() => setActiveCode(entries[0].code)} disabled={busy}>
                  Use my deal: {dealLabel(entries[0].code)}
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
                  onClick={close}
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
              {email && (
                <p className="cart-identity">
                  <span className="cart-identity-label">Checking out as</span>
                  <strong className="cart-identity-email">{email}</strong>
                  <button type="button" className="cart-code-remove" onClick={notYou}>
                    Not you?
                  </button>
                </p>
              )}
              {storeError && <p className="cart-error">{storeError}</p>}
              <p className="cart-footer-note">
                {ship.unlocked ? "Free shipping · taxes calculated at checkout." : "Shipping & taxes calculated at checkout."}
              </p>
            </footer>
          )}

          {items.length > 0 && step === "email" && (
            <footer className="cart-footer">
              <form className="cart-email" onSubmit={onEmailSubmit} noValidate>
                <label className="cart-field">
                  <span className="cart-email-title">Your email for order updates</span>
                  <input
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </label>
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
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
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
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
