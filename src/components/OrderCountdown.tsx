// ORDER COUNTDOWN (founder, Nov 23 2026): one section that replaces both the
// first countdown draft and the FederalDateNotice. Live clock to ORDER_DEADLINE
// in lib/sale.ts (Sun Dec 6, 11:59:59 PM CT, the same instant for every
// visitor). Places:
//   home       top of section 02, above the sale block      variant "full"
//   /products  under the page hero, above the sale block    variant "full", ctaHref "#lineup"
//   PDP        under the price, above the pack sizes        variant "compact": red pill,
//              no button; not on NO_COUNTDOWN_TIERS (10mg)
//
//   eyebrow  gold, letter-spaced, 2 lines  FEDERAL HEMP RULES MEAN / THE LAST DAY TO ORDER IS
//   pill     black, cream caps             {ORDER_DEADLINE_LABEL}
//   clock    4 outlined boxes              DD DAYS · HH HRS · MM MIN · SS SEC (gradient digits)
//   headline gradient SVG, two lines       GRAB SUNRISE™ / WHILE YOU CAN
//   button   red .btn-primary              SHOP THE SALE
// Copy is the founder's, word for word (Nov 23). No other wording.
// Server render shows dashes; the clock starts in the browser after hydration
// (no hydration mismatch). Ticks once a second, tabular digits, no motion.
// AT ZERO it stops at 00 00 00 00 and STAYS, text unchanged (founder, Nov 19:
// nothing disappears automatically). Take it down by hand: delete this file +
// its CSS and the one line each in routes/index.tsx, routes/products.tsx and
// routes/products_.$slug.tsx.

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ORDER_DEADLINE, ORDER_DEADLINE_LABEL } from "../lib/sale";
import "./OrderCountdown.css";

const DEADLINE_MS = Date.parse(ORDER_DEADLINE);

/** Spoken once, never ticking: "Sunday, December 6 at 11:59 PM Central". */
const SR_DATE = (() => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(DEADLINE_MS));
  } catch {
    return ORDER_DEADLINE_LABEL.split("·")[0].trim();
  }
})();
const SR_LABEL = `Last day to order is ${SR_DATE} at 11:59 PM Central.`;
const SR_FULL = `Federal hemp rules mean the last day to order is ${SR_DATE} at 11:59 PM Central. Grab SUNRISE while you can.`;

/** Headline gradient: same stops as the wordmark and the S02 manifesto. */
const GRAD = ["#4F308D", "#822665", "#94264B", "#BF252D", "#CC382C", "#DC531F", "#E76B37"];
/** Headline viewBox width (font-size-100 units): "GRAB SUNRISE™" measures 913,
 *  "WHILE YOU CAN" 901 in Montserrat (getBBox, Nov 18). */
const HL_W = 916;

/** "Sunday, Dec 6 · 11:59 PM CT" → "Sun, Dec 6" for the compact line. */
const SHORT_DATE = (() => {
  const d = ORDER_DEADLINE_LABEL.split("·")[0].trim(); // "Sunday, Dec 6"
  const [wd, rest] = d.split(",");
  return rest ? `${wd.trim().slice(0, 3)},${rest}` : d;
})();

type Parts = { d: string; h: string; m: string; s: string };
const DASH: Parts = { d: "--", h: "--", m: "--", s: "--" };
const pad = (n: number) => String(n).padStart(2, "0");
function partsAt(now: number): Parts {
  const left = Math.max(0, Math.floor((DEADLINE_MS - now) / 1000));
  return {
    d: pad(Math.floor(left / 86400)),
    h: pad(Math.floor((left % 86400) / 3600)),
    m: pad(Math.floor((left % 3600) / 60)),
    s: pad(left % 60),
  };
}

function useCountdown(): Parts {
  const [p, setP] = useState<Parts>(DASH); // server + first client render
  useEffect(() => {
    let id: number | undefined;
    const tick = () => {
      const now = Date.now();
      setP(partsAt(now));
      if (now >= DEADLINE_MS && id !== undefined) {
        window.clearInterval(id); // stays at 00; nothing hides
        id = undefined;
      }
    };
    tick();
    if (Date.now() < DEADLINE_MS) id = window.setInterval(tick, 1000);
    return () => {
      if (id !== undefined) window.clearInterval(id);
    };
  }, []);
  return p;
}

const UNITS: Array<{ k: keyof Parts; label: string; short: string }> = [
  { k: "d", label: "Days", short: "d" },
  { k: "h", label: "Hrs", short: "h" },
  { k: "m", label: "Min", short: "m" },
  { k: "s", label: "Sec", short: "s" },
];

export function OrderCountdown({
  variant = "full",
  className = "",
  ctaHref = "/products",
}: {
  variant?: "full" | "compact";
  className?: string;
  ctaHref?: string;
}) {
  const p = useCountdown();

  if (variant === "compact") {
    return (
      <div className={`order-cd-compact ${className}`.trim()} role="timer" aria-label={SR_LABEL}>
        <span className="order-cd-compact-eyebrow" aria-hidden="true">Last day to order</span>
        <span className="order-cd-compact-sep" aria-hidden="true">·</span>
        <span className="order-cd-compact-date" aria-hidden="true">{SHORT_DATE}</span>
        <span className="order-cd-compact-sep" aria-hidden="true">·</span>
        <span className="order-cd-compact-clock" aria-hidden="true">
          {UNITS.map((u) => (
            <span key={u.k} className="order-cd-compact-unit">
              {p[u.k]}
              <small>{u.short}</small>
            </span>
          ))}
        </span>
      </div>
    );
  }

  return (
    <section className={`order-cd ${className}`.trim()}>
      <div className="container">
        <h2 className="sr-only">{SR_FULL}</h2>
        <div className="order-cd-inner" aria-hidden="true">
          <p className="order-cd-eyebrow">
            Federal hemp rules mean
            <br />
            the last day to order is
          </p>
          <p className="order-cd-pill">{ORDER_DEADLINE_LABEL.toUpperCase()}</p>
          <div className="order-cd-clock">
            {UNITS.map((u, i) => (
              <div key={u.k} className={`order-cd-box is-${i}`}>
                <span className="order-cd-num">{p[u.k]}</span>
                <span className="order-cd-label">{u.label}</span>
              </div>
            ))}
          </div>
          <svg className="order-cd-headline" viewBox={`0 0 ${HL_W} 215`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="order-cd-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={HL_W} y2="0">
                {GRAD.map((c, i) => (
                  <stop key={c} offset={i / (GRAD.length - 1)} stopColor={c} />
                ))}
              </linearGradient>
            </defs>
            <text x={HL_W / 2} y="82" textAnchor="middle" fill="url(#order-cd-grad)" fontFamily="Montserrat, sans-serif" fontSize="100">
              <tspan fontWeight="900" letterSpacing="1">GRAB</tspan>
              <tspan fontWeight="500" letterSpacing="12.5" dx="28">SUNRISE</tspan>
              <tspan fontWeight="700" fontSize="37.5" dy="-46" dx="-10">™</tspan>
            </text>
            <text x={HL_W / 2} y="195" textAnchor="middle" fill="url(#order-cd-grad)" fontFamily="Montserrat, sans-serif" fontSize="100" fontWeight="900" letterSpacing="1">
              WHILE YOU CAN
            </text>
          </svg>
        </div>
        {ctaHref.startsWith("#") ? (
          <a href={ctaHref} className="btn btn-primary order-cd-cta">
            Shop the Sale
          </a>
        ) : (
          <Link to="/products" className="btn btn-primary order-cd-cta">
            Shop the Sale
          </Link>
        )}
      </div>
    </section>
  );
}
