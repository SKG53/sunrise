// FEDERAL DATE NOTICE (approved Nov 18 2026): the "Federal hemp rules change
// December 11" block from the GM2 / Brevo #336 sale emails, rebuilt as live
// text. Home: directly under section 02 (sale deal or manifesto), above 03
// PRODUCT INTRO. /products (added Nov 18, founder): directly under the sale
// block, above the tier switcher (className "is-products").
//
//   eyebrow  gold, letter-spaced     FEDERAL HEMP RULES CHANGE
//   pill     black, cream caps       {FEDERAL_DATE_LABEL} (lib/sale.ts)
//   headline gradient, two lines     GRAB SUNRISE™ / WHILE YOU CAN
//   subline  near-black, spaced      ORDER YOUR FAVORITES TODAY, / BEFORE THE LAWS CHANGE
//   button   red .btn-primary        SHOP THE LINEUP → /products
//
// Shows whether or not a sale is on, until FEDERAL_DATE_CUTOFF (Dec 11 00:00
// CT), then disappears by itself. The date lives in lib/sale.ts only, so a
// change by Congress is a one-line edit there. Copy is approved word for
// word: say the date and nothing else about the law.
//
// The headline is one SVG (like the S02 manifesto lines): it scales to the
// column width, and the brand gradient runs continuously across "GRAB
// SUNRISE™" and "WHILE YOU CAN", as in the email. "SUNRISE" uses the
// wordmark's own type (Montserrat 500, 0.125em tracking, 0.375× bold ™).
// Remove the whole thing: delete this file + its CSS and the one line each in
// routes/index.tsx and routes/products.tsx.

import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FEDERAL_DATE_CUTOFF, FEDERAL_DATE_LABEL } from "../lib/sale";
import "./FederalDateNotice.css";

/** Same stops as the S02 manifesto and the wordmark gradient. */
const GRAD = ["#4F308D", "#822665", "#94264B", "#BF252D", "#CC382C", "#DC531F", "#E76B37"];

// Headline viewBox width in font-size-100 units: line 1 "GRAB SUNRISE™"
// measures 913 and line 2 "WHILE YOU CAN" 901 in Montserrat (getBBox, Nov 18),
// so 916 lets the longer line fill the column. Re-measure only if the words
// or type change.
const HL = { W: 916 };

export function federalNoticeOn(now: number = Date.now()): boolean {
  return now < Date.parse(FEDERAL_DATE_CUTOFF);
}

/** ctaHref: where SHOP THE LINEUP goes. Home → /products. On /products itself
 *  it jumps down to the tier switcher (#lineup) instead of reloading the page. */
export function FederalDateNotice({ className = "", ctaHref = "/products" }: { className?: string; ctaHref?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!federalNoticeOn()) return null;
  const date = FEDERAL_DATE_LABEL.toUpperCase();
  const { W } = HL;
  return (
    <section ref={ref} className={`fed-notice ${className}${inView ? " in-view" : ""}`.trim()}>
      <div className="container">
        <h2 className="sr-only">
          Federal hemp rules change {FEDERAL_DATE_LABEL}. Grab SUNRISE while you can.
        </h2>
        <div className="fed-notice-inner" aria-hidden="true">
          <p className="fed-notice-eyebrow">Federal hemp rules change</p>
          <p className="fed-notice-pill">{date}</p>
          <svg className="fed-notice-headline" viewBox={`0 0 ${W} 215`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="fed-notice-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
                {GRAD.map((c, i) => (
                  <stop key={c} offset={i / (GRAD.length - 1)} stopColor={c} />
                ))}
              </linearGradient>
            </defs>
            <text x={W / 2} y="82" textAnchor="middle" fill="url(#fed-notice-grad)" fontFamily="Montserrat, sans-serif" fontSize="100">
              <tspan fontWeight="900" letterSpacing="1">GRAB</tspan>
              <tspan fontWeight="500" letterSpacing="12.5" dx="28">SUNRISE</tspan>
              <tspan fontWeight="700" fontSize="37.5" dy="-46" dx="-10">™</tspan>
            </text>
            <text x={W / 2} y="195" textAnchor="middle" fill="url(#fed-notice-grad)" fontFamily="Montserrat, sans-serif" fontSize="100" fontWeight="900" letterSpacing="1">
              WHILE YOU CAN
            </text>
          </svg>
          <p className="fed-notice-sub">
            Order your favorites today,<br /> before the laws change
          </p>
        </div>
        {ctaHref.startsWith("#") ? (
          <a href={ctaHref} className="btn btn-primary fed-notice-cta">
            Shop the Lineup
          </a>
        ) : (
          <Link to="/products" className="btn btn-primary fed-notice-cta">
            Shop the Lineup
          </Link>
        )}
      </div>
    </section>
  );
}
