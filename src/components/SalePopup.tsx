// SALE POPUP (Nov 2026): replaces Spin & Save while a sale phase is on
// (lib/sale.ts). One message: the deal applies automatically at checkout. No email
// capture here (founder, Nov 13): emails are collected at other steps.
//
// Shows once per visit, after the 21+ gate, on the first of: a 6s timer or
// desktop exit intent. Never shown to email visitors (they came from a sale
// email), never on review pages or Build Your Box pages.

import { useCallback, useEffect, useRef, useState } from "react";
import { activeSale, SALE_ALL_LABEL, type SalePhase } from "../lib/sale";
import { isEmailVisitor } from "../lib/utms";
import { siteEvent } from "../lib/siteEvents";
import { render10mgLockup, render30mgLockup, render60mgLockup, renderWordmark } from "../lib/sunrise-components";
import { SaleTitle } from "./SaleFireworks";
import { SaleRibbon } from "./SaleDeals";
import "./SalePopup.css";

const SEEN_KEY = "sunrise:sale-popup-seen";
const AGE_KEY = "sunrise:age-verified";
const FALLBACK_MS = 6000;
const EXIT_GUARD_MS = 2000;

const onNoPopupPath = () =>
  /^\/(submitreview|reviewsubmit|tryfreecan|webfreecan|freecan)\/?$/.test(
    window.location.pathname,
  ) || /^\/box\//.test(window.location.pathname);

export function SalePopup() {
  const [sale, setSale] = useState<SalePhase | null>(null);
  const [open, setOpen] = useState(false);
  const wmRef = useRef<HTMLDivElement>(null);
  const l60 = useRef<HTMLSpanElement>(null);
  const l30 = useRef<HTMLSpanElement>(null);
  const l10 = useRef<HTMLSpanElement>(null);
  const openRef = useRef(false);
  openRef.current = open;

  const close = useCallback((reason: string) => {
    if (openRef.current) siteEvent("Sale Popup Closed", { reason });
    try {
      sessionStorage.setItem(SEEN_KEY, "true");
    } catch {
      /* private mode */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    const phase = activeSale();
    setSale(phase);
    if (!phase) return;
    let armed = false;
    let done = false;
    let armedAt = 0;
    const timers: number[] = [];
    const eligible = () => {
      if (onNoPopupPath()) return false;
      try {
        if (sessionStorage.getItem(SEEN_KEY) === "true") return false;
        if (sessionStorage.getItem(AGE_KEY) !== "true") return false;
        if (isEmailVisitor()) return false;
      } catch {
        return false;
      }
      return true;
    };
    const cleanup = () => {
      document.removeEventListener("mouseout", onMouseOut);
      timers.forEach((t) => clearTimeout(t));
    };
    const reveal = () => {
      if (done || onNoPopupPath()) return;
      done = true;
      cleanup();
      siteEvent("Sale Popup Shown", { phase: phase.id }, { queue: true });
      setOpen(true);
    };
    function onMouseOut(e: MouseEvent) {
      if (Date.now() - armedAt < EXIT_GUARD_MS || e.relatedTarget) return;
      if ((e.clientY ?? 1) <= 0) reveal();
    }
    const arm = () => {
      if (armed || done || !eligible()) return;
      armed = true;
      armedAt = Date.now();
      document.addEventListener("mouseout", onMouseOut);
      timers.push(window.setTimeout(reveal, FALLBACK_MS));
    };
    arm();
    window.addEventListener("sunrise:age-verified", arm);
    return () => {
      cleanup();
      window.removeEventListener("sunrise:age-verified", arm);
    };
  }, []);

  // Scroll lock + ESC while open; wordmark like the age gate.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close("escape");
    window.addEventListener("keydown", onKey);
    const small = window.matchMedia("(max-width: 520px)").matches;
    if (wmRef.current) {
      wmRef.current.innerHTML = renderWordmark(small ? 26 : 30);
    }
    // Tier lockups in their tier colors (60 plum, 30 green, 10 red).
    const lb = small ? 26 : 32;
    if (l60.current) l60.current.innerHTML = render60mgLockup(lb, "#61213A");
    if (l30.current) l30.current.innerHTML = render30mgLockup(lb, "#0B6134");
    if (l10.current) l10.current.innerHTML = render10mgLockup(lb, "#CC1F39");
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open || !sale) return null;
  return (
    <div className="sale-pop" role="dialog" aria-modal="true" aria-labelledby="sale-pop-title">
      <div className="sale-pop-backdrop" onClick={() => close("backdrop")} aria-hidden="true" />
      <div className="sale-pop-card">
        <button
          type="button"
          className="sale-pop-close"
          onClick={() => close("dismiss")}
          aria-label="Close"
        >
          ×
        </button>
        <div className="sale-pop-wordmark" ref={wmRef} aria-hidden="true" />
        <p className="sale-pop-kicker">
          <SaleTitle size="md">{sale.name}</SaleTitle>
        </p>
        <h2 id="sale-pop-title" className="sr-only">
          {sale.name}: {sale.pctAll}% off {SALE_ALL_LABEL}, {sale.pctTen}% off 10mg
        </h2>
        <div className="sale-pop-deals" aria-hidden="true">
          <div className="sale-pop-deal is-all">
            <SaleRibbon text={`${sale.pctAll}% OFF`} typeOn={false} className="sale-pop-ribbon" />
            <span className="sale-pop-tiers">
              <span className="sale-pop-lockup" ref={l60} />
              <span className="sale-pop-and">+</span>
              <span className="sale-pop-lockup" ref={l30} />
            </span>
          </div>
          <span className="sale-pop-divider" />
          <div className="sale-pop-deal is-ten">
            <SaleRibbon text={`${sale.pctTen}% OFF`} typeOn={false} className="sale-pop-ribbon" />
            <span className="sale-pop-tiers">
              <span className="sale-pop-lockup" ref={l10} />
            </span>
          </div>
        </div>
        <p className="sale-pop-body">Every pack size. Applied automatically at checkout.</p>
        <a
          href="/products"
          className="sale-pop-cta"
          onClick={() => {
            siteEvent("Sale Popup Shop Clicked", { phase: sale.id });
            close("shop_now");
          }}
        >
          Shop the sale
        </a>
      </div>
    </div>
  );
}
