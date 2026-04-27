// Sticky cream header. activeNav prop highlights the current route in gold.
// Below 768px, desktop nav + CTAs are hidden and a hamburger button reveals
// a full-viewport mobile drawer containing the same nav links + CTAs at
// touch-friendly sizes. Cart drawer trigger stays in the header bar on all
// viewports — it's its own concern, independent of the menu drawer.

import { useEffect, useRef, useState } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";
import { CartDrawer } from "./CartDrawer";

type NavKey = "home" | "products" | "about" | "find" | "contact";

const NAV_LINKS: { key: NavKey; href: string; label: string }[] = [
  { key: "home",     href: "/",         label: "Home" },
  { key: "products", href: "/products", label: "Products" },
  { key: "about",    href: "/about",    label: "About" },
  { key: "find",     href: "/find",     label: "Find" },
  { key: "contact",  href: "/contact",  label: "Contact" },
];

export function SiteHeader({ activeNav }: { activeNav?: NavKey }) {
  const wmRef = useRef<HTMLDivElement>(null);
  const drawerWmRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Wordmark paint — header (gradient, 0.69×base) and drawer head (gradient,
  // 0.85×base for slightly bigger presence inside the drawer). Repaints on
  // resize so the wordmark stays sharp across viewport transitions.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      if (wmRef.current)       wmRef.current.innerHTML       = renderWordmark(base * 0.69, "gradient");
      if (drawerWmRef.current) drawerWmRef.current.innerHTML = renderWordmark(base * 0.85, "gradient");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  // Body scroll lock + ESC-to-close while the mobile menu is open. Effect
  // re-runs only on isMenuOpen change; cleanup restores body overflow and
  // detaches the keydown listener whether the user closed via ESC, backdrop
  // click, link tap, or close button.
  useEffect(() => {
    if (!isMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const linkClass = (key: NavKey) => (activeNav === key ? "active" : undefined);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <a href="/" aria-label="SUNRISE home">
          <div className="wordmark-slot" ref={wmRef} />
        </a>

        <nav className="site-nav" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a key={l.key} href={l.href} className={linkClass(l.key)}>{l.label}</a>
          ))}
        </nav>

        <div className="nav-right">
          <a
            href="https://marketing8710.wixstudio.com/beverage-manufacture/blank"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cta outline"
          ><span className="no-transform">COAs</span></a>
          <a href="/products" className="nav-cta solid">Shop</a>
          <CartDrawer />
          <button
            type="button"
            className="nav-hamburger"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu-drawer"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <span className="nav-hamburger-bars" aria-hidden="true">
              <span /><span /><span />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu drawer. Rendered always (so the open/close transition has
          a consistent target); CSS hides it on desktop and visually conceals
          it on mobile until is-open is applied. role=dialog + aria-modal     */}
      <div
        id="mobile-menu-drawer"
        className={`mobile-menu${isMenuOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-backdrop" onClick={closeMenu} aria-hidden="true" />
        <div className="mobile-menu-panel">
          <div className="mobile-menu-head">
            <a href="/" aria-label="SUNRISE home" onClick={closeMenu}>
              <div className="wordmark-slot" ref={drawerWmRef} />
            </a>
            <button
              type="button"
              className="mobile-menu-close"
              aria-label="Close menu"
              onClick={closeMenu}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <line x1="5"  y1="5"  x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="19" y1="5"  x2="5"  y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="mobile-menu-nav" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <a
                key={l.key}
                href={l.href}
                className={linkClass(l.key)}
                onClick={closeMenu}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mobile-menu-ctas">
            <a
              href="https://marketing8710.wixstudio.com/beverage-manufacture/blank"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-menu-cta outline"
              onClick={closeMenu}
            >COAs</a>
            <a
              href="/products"
              className="mobile-menu-cta solid"
              onClick={closeMenu}
            >Shop</a>
          </div>
        </div>
      </div>
    </>
  );
}
