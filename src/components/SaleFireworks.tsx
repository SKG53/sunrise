// SALE FIREWORKS (Nov 2026): the Labor Day bar's mini-firework particles,
// looping continuously around a sale title ("HOLIDAY SALE" wherever it shows:
// home section 02, the sale popup, the cart's sale line).
//
// Pure CSS loop: each burst replays every CYCLE seconds with a staggered
// delay, so there is always one popping somewhere. No timers, no JS per frame.
// Reduced-motion: the bursts are not rendered (CSS hides them too).

import type { CSSProperties, ReactNode } from "react";
import "./SaleFireworks.css";

// Burst positions per size (percent of the title box). They sit on the
// flanks and corners so the sparks frame the words instead of covering them.
const SPOTS: Record<"sm" | "md" | "lg", Array<{ left: string; top: string }>> = {
  lg: [
    { left: "-9%", top: "30%" },
    { left: "4%", top: "-28%" },
    { left: "30%", top: "-40%" },
    { left: "70%", top: "125%" },
    { left: "96%", top: "-30%" },
    { left: "109%", top: "60%" },
  ],
  md: [
    { left: "-10%", top: "45%" },
    { left: "-4%", top: "-10%" },
    { left: "104%", top: "-10%" },
    { left: "110%", top: "50%" },
    { left: "-6%", top: "105%" },
    { left: "106%", top: "105%" },
  ],
  sm: [
    { left: "-6%", top: "50%" },
    { left: "50%", top: "-55%" },
    { left: "106%", top: "50%" },
  ],
};
// Tier palette + gold; cream would vanish on the cream page.
const COLORS = ["var(--tier-10)", "var(--gold)", "var(--tier-30)", "var(--tier-5)", "#61213A", "var(--gold)"];
const CYCLE = 2.4; // seconds per burst loop

export function SaleTitle({
  children,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  /** sm = cart line, md = popup, lg = home heading */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={`sale-fw-title is-${size} ${className}`.trim()}>
      <span className="sale-fw-layer" aria-hidden="true">
        {SPOTS[size].map((s, i, all) => {
          const delay = `${(i * CYCLE) / all.length}s`;
          return (
            <span
              key={i}
              className="sale-fw-burst"
              style={{ left: s.left, top: s.top, color: COLORS[i], animationDelay: delay } as CSSProperties}
            >
              {Array.from({ length: 12 }).map((_, j) => (
                <span
                  key={j}
                  className="sale-fw-particle"
                  style={{ "--rotate": `${j * 30}deg`, animationDelay: delay } as CSSProperties}
                />
              ))}
            </span>
          );
        })}
      </span>
      <span className="sale-fw-text">{children}</span>
    </span>
  );
}
