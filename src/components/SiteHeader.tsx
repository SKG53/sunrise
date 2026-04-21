// =============================================================================
// SUNRISE — SiteHeader.tsx
// Path: src/components/SiteHeader.tsx
// Sticky cream header. Wordmark left, nav center, COAs + Shop CTAs right.
// activeNav prop highlights current route in gold.
// =============================================================================

import { useEffect, useRef } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";

type NavKey = "home" | "products" | "about" | "near-you" | "contact";

export function SiteHeader({ activeNav }: { activeNav?: NavKey }) {
  const wmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(base * 0.69, "gradient");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  const linkClass = (key: NavKey) => (activeNav === key ? "active" : undefined);

  return (
    <header className="site-header">
      <a href="/" aria-label="SUNRISE home">
        <div className="wordmark-slot" ref={wmRef} />
      </a>
      <nav className="site-nav">
        <a href="/" className={linkClass("home")}>Home</a>
        <a href="/products" className={linkClass("products")}>Products</a>
        <a href="/about" className={linkClass("about")}>About</a>
        <a href="/near-you" className={linkClass("near-you")}>Near You</a>
        <a href="/contact" className={linkClass("contact")}>Contact</a>
      </nav>
      <div className="nav-right">
        <a href="#" className="nav-cta outline">COAs</a>
        <a href="#" className="nav-cta solid">Shop</a>
      </div>
    </header>
  );
}
