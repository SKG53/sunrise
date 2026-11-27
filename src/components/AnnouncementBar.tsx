// Site-wide rotating announcement bar. Mounted in __root.tsx so it renders
// above the sticky header on every route — product pages, policy pages, 404.
//
// During a sale phase (lib/sale.ts) two slides take turns (sale 5s, free
// shipping 3.5s — slowed Nov 13 so the longer sale line is easy to read) with a
// left→right slide: the outgoing banner exits to the right while the incoming
// enters from the left (the Labor Day bar, restored Nov 13 2026).
//   - Sale slide: deep-purple field, "HOLIDAY SALE: 30% off 30mg + 60mg ·
//     60% off 10mg" with gold emphasis; it pops a scatter of mini fireworks
//     each time it lands.
//   - Free-shipping slide: the evergreen line on the gold field.
// With no sale phase on, only the free-shipping line shows (no rotation).
//
// BLACK FRIDAY MEGA SALE (Nov 27; MEGA_SALE_ENABLED in lib/sale.ts): the
// sale slide reads "BLACK FRIDAY MEGA SALE · 30% OFF + FREE 4-PACKS WITH
// EVERY $100 · Ends Monday 11:59 PM CT" (GM6 email v3 wording). One line on
// desktop; three short lines on phones, never shrunk below the sale slide's
// size.
//
// Each slide links to /products. Reduced-motion: rotation still runs so both
// messages are seen, but the slide becomes a plain fade and fireworks are
// suppressed. Styling lives in sunrise-shell.css under ANNOUNCEMENT BAR.

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { activeSale, MEGA_SALE_ENABLED, SALE_ALL_LABEL } from "../lib/sale";

type Banner = { sale: boolean; node: ReactNode };

const FREE_SHIPPING: Banner = {
  sale: false,
  node: (
    <>
      Free shipping on all orders <span className="announcement-bar-emph">$75+</span>
    </>
  ),
};

// Scatter points + colors for the mini fireworks. Colors cycle the tier
// palette + gold/cream so the bursts read against the deep-purple field.
const FW_SPOTS = [
  { left: "8%", top: "46%" },
  { left: "27%", top: "26%" },
  { left: "46%", top: "60%" },
  { left: "62%", top: "30%" },
  { left: "80%", top: "54%" },
  { left: "92%", top: "34%" },
];
const FW_COLORS = ["var(--tier-5)", "var(--tier-10)", "var(--tier-30)", "var(--gold)", "var(--cream)"];
/** How long each slide stays up, by index: 0 = sale, 1 = free shipping. */
const DWELL_MS = [5000, 3500];

function Fireworks() {
  return (
    <div className="announcement-bar-fw" aria-hidden="true">
      {FW_SPOTS.map((s, i) => (
        <span
          key={i}
          className="ann-burst"
          style={{
            left: s.left,
            top: s.top,
            color: FW_COLORS[i % FW_COLORS.length],
            animationDelay: `${i * 0.09}s`,
          }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <span
              key={j}
              className="ann-particle"
              style={{ "--rotate": `${j * 30}deg`, animationDelay: `${i * 0.09}s` } as CSSProperties}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

export function AnnouncementBar() {
  const sale = activeSale();
  const banners: Banner[] = sale && MEGA_SALE_ENABLED
    ? [
        {
          sale: true,
          node: (
            <span className="announcement-bar-mega">
              <span className="announcement-bar-name">BLACK FRIDAY MEGA SALE</span>
              <span className="announcement-bar-sep"> · </span>
              <span className="announcement-bar-mega-deal">
                <span className="announcement-bar-emph">30% OFF</span> + <span className="announcement-bar-emph">FREE 4-PACKS</span> WITH EVERY $100
              </span>
              <span className="announcement-bar-sep"> · </span>
              <span className="announcement-bar-mega-end">Ends Monday 11:59 PM CT</span>
            </span>
          ),
        },
        FREE_SHIPPING,
      ]
    : sale
    ? [
        {
          sale: true,
          node: (
            <>
              <span className="announcement-bar-name">{sale.name}:</span>{" "}
              <span className="announcement-bar-emph">{sale.pctAll}% off</span> {SALE_ALL_LABEL}
              {/* 10mg line only while the phase has a 10mg deal (none since Nov 23) */}
              {sale.pctTen > 0 && (
                <>
                  {" "}·{" "}<span className="announcement-bar-emph">{sale.pctTen}% off</span> 10mg
                </>
              )}
            </>
          ),
        },
        FREE_SHIPPING,
      ]
    : [FREE_SHIPPING];
  const count = banners.length;

  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [burst, setBurst] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (count < 2) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.("change", onChange);
    let cur = 0;
    let id = 0;
    const step = () => {
      const next = (cur + 1) % count;
      setPrev(cur);
      setIdx(next);
      if (next === 0 && !mq.matches) setBurst((b) => b + 1); // slide 0 is the sale
      cur = next;
      id = window.setTimeout(step, DWELL_MS[cur] ?? 4000);
    };
    id = window.setTimeout(step, DWELL_MS[0]);
    return () => {
      clearTimeout(id);
      mq.removeEventListener?.("change", onChange);
    };
  }, [count]);

  // Drop the leaving slide once its transition finishes.
  useEffect(() => {
    if (prev === null) return;
    const t = setTimeout(() => setPrev(null), 480);
    return () => clearTimeout(t);
  }, [prev, idx]);

  const cur = banners[idx] ?? banners[0];
  return (
    <div className={"announcement-bar" + (cur.sale ? " is-sale" : "")} role="region" aria-label="Announcements">
      {cur.sale && !reduce && <Fireworks key={burst} />}
      <div className="announcement-bar-track">
        {banners.map((b, i) => (
          <a
            key={i}
            href="/products"
            className={
              "announcement-bar-slide" +
              (b.sale ? " is-sale-slide" : "") +
              (i === idx ? " is-active" : "") +
              (i === prev ? " is-leaving" : "")
            }
            aria-hidden={i === idx ? undefined : true}
            tabIndex={i === idx ? undefined : -1}
          >
            {b.node}
          </a>
        ))}
      </div>
    </div>
  );
}
