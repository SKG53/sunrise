// SALE DEALS SECTION (lib/sale.ts): the "HOLIDAY SALE" block shared by the
// home page (in place of the REFRESH manifesto, section 02) and the top of
// /products. One block per deal so the two offers read separately:
//   heading  "HOLIDAY SALE" with the looping fireworks (SaleFireworks)
//   deals    brand-gold "{X}% OFF" with the real potency lockups in their tier
//            colors underneath (60 plum, 30 green, 10 red); side by side with
//            a divider on desktop, stacked on phones
//   note     "Applied automatically at checkout."
//   CTA      red "Shop the sale" (home only; /products is already the shop)
// The % lines keep the manifesto's type-on reveal, started when the block
// scrolls into view.

import { useEffect, useRef, useState } from "react";
import type { SalePhase } from "../lib/sale";
import { render10mgLockup, render30mgLockup, render60mgLockup } from "../lib/sunrise-components";
import { SaleTitle } from "./SaleFireworks";
import "./SaleDeals.css";

const TIER_COLOR = { 10: "#CC1F39", 30: "#0B6134", 60: "#61213A" } as const;

// Ink width / left offset of each "% OFF" line in Montserrat 900 at 100px
// (fontTools-measured, same method as the home manifesto), so lines fill
// their column edge to edge. Unknown values fall back to 475 / 0.
const PCT_METRICS: Record<string, [number, number]> = {
  "30% OFF": [470.7, 0.6],
  "40% OFF": [477.6, -2.3],
  "45% OFF": [470.3, -2.3],
  "60% OFF": [471.9, -2.9],
  "65% OFF": [464.6, -2.9],
  "70% OFF": [471.1, -2.1],
};

// Ribbon banner around each "% OFF": gold band with a stitched edge, notched
// tails folded behind it. Geometry in viewBox units (text at 100px).
const RIB = { tail: 54, pad: 58, bandH: 124, drop: 24, fold: 30, notch: 30 };
const RIB_GOLD = "#C4922A";
const RIB_TAIL = "#A87C22";
const RIB_FOLD = "#7A5915";

/** Gold ribbon with "{X}% OFF". Shared by the sale block and the sale popup.
 *  typeOn: characters fade in one by one once a parent gets .in-view. */
export function SaleRibbon({
  text,
  charOffset = 0,
  typeOn = true,
  className = "",
}: {
  text: string;
  charOffset?: number;
  typeOn?: boolean;
  className?: string;
}) {
  const [inkW, inkX] = PCT_METRICS[text] ?? [475, 0];
  const { tail: T, pad, bandH, drop, fold, notch } = RIB;
  const bandW = inkW + pad * 2;
  const W = T * 2 + bandW;
  const H = bandH + drop;
  const r = T + bandW; // band right edge
  const ty0 = drop, ty1 = bandH + drop, tmid = (ty0 + ty1) / 2;
  return (
    <svg className={`sale-ribbon ${className}`.trim()} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {/* tails */}
      <polygon points={`0,${ty0} ${T + fold},${ty0} ${T + fold},${ty1} 0,${ty1} ${notch},${tmid}`} fill={RIB_TAIL} />
      <polygon points={`${W},${ty0} ${r - fold},${ty0} ${r - fold},${ty1} ${W},${ty1} ${W - notch},${tmid}`} fill={RIB_TAIL} />
      {/* folds */}
      <polygon points={`${T},${bandH} ${T + fold},${bandH} ${T + fold},${ty1}`} fill={RIB_FOLD} />
      <polygon points={`${r},${bandH} ${r - fold},${bandH} ${r - fold},${ty1}`} fill={RIB_FOLD} />
      {/* band */}
      <rect x={T} y={0} width={bandW} height={bandH} fill={RIB_GOLD} />
      <line x1={T + 10} y1={11} x2={r - 10} y2={11} className="sale-ribbon-stitch" />
      <line x1={T + 10} y1={bandH - 11} x2={r - 10} y2={bandH - 11} className="sale-ribbon-stitch" />
      <text x={T + pad + inkX} y={bandH / 2 + 36} fontFamily="Montserrat, sans-serif" fontWeight="900" fontSize="100" letterSpacing="1" className="sale-ribbon-text">
        {text.split("").map((ch, i) => (
          <tspan
            key={i}
            className={typeOn ? "sale-deals-char" : undefined}
            style={typeOn ? { animationDelay: `${450 + (charOffset + i) * 50}ms` } : undefined}
          >
            {ch === " " ? "\u00a0" : ch}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

export function SaleDeals({
  sale,
  showCta = true,
  className = "",
}: {
  sale: SalePhase;
  showCta?: boolean;
  className?: string;
}) {
  const stackRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const l60 = useRef<HTMLSpanElement>(null);
  const l30 = useRef<HTMLSpanElement>(null);
  const l10 = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const paint = () => {
      const small = window.innerWidth <= 520;
      const base = small ? 58 : 82;
      if (l60.current) l60.current.innerHTML = render60mgLockup(base, TIER_COLOR[60]);
      if (l30.current) l30.current.innerHTML = render30mgLockup(base, TIER_COLOR[30]);
      if (l10.current) l10.current.innerHTML = render10mgLockup(base, TIER_COLOR[10]);
    };
    paint();
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  useEffect(() => {
    const el = stackRef.current;
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

  const allText = `${sale.pctAll}% OFF`;
  const tenText = `${sale.pctTen}% OFF`;
  return (
    <section className={`sale-deals-section ${className}`.trim()}>
      <div className="container">
        <h2 className="sale-deals-heading">
          <SaleTitle size="lg">{sale.name}</SaleTitle>
          <span className="sr-only">
            : {sale.pctAll}% off 30mg and 60mg drinks{sale.pctTen > 0 ? `, ${sale.pctTen}% off 10mg drinks` : ""}.
          </span>
        </h2>
        <div ref={stackRef} className={`sale-deals${inView ? " in-view" : ""}`}>
          <a href="/products?tier=60" className="sale-deal is-all">
            <span className="sale-deal-pct">
              <SaleRibbon text={allText} className="sale-deals-pct" />
            </span>
            <span className="sale-deal-tiers">
              <span className="sale-deal-lockup" ref={l60} />
              <span className="sale-deal-plus" aria-hidden="true">+</span>
              <span className="sale-deal-lockup" ref={l30} />
            </span>
          </a>
          {/* 10mg deal only while the phase has one (none since Nov 23) */}
          {sale.pctTen > 0 && (
            <>
              <span className="sale-deal-divider" aria-hidden="true" />
              <a href="/products?tier=10" className="sale-deal is-ten">
                <span className="sale-deal-pct">
                  <SaleRibbon text={tenText} charOffset={allText.length} className="sale-deals-pct" />
                </span>
                <span className="sale-deal-tiers">
                  <span className="sale-deal-lockup" ref={l10} />
                </span>
              </a>
            </>
          )}
        </div>
        <p className="sale-deals-note">Applied automatically at checkout.</p>
        {showCta && (
          <a href="/products" className="sale-deals-cta">
            Shop the sale
          </a>
        )}
      </div>
    </section>
  );
}
