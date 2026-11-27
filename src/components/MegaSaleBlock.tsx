// BLACK FRIDAY MEGA SALE block (Nov 27, lib/megaSale.ts): home and /products,
// directly under the order countdown and above the 30% OFF sale block.
// Wording matches the GM6 email v3 (founder, Nov 27): BLACK FRIDAY / MEGA
// SALE / 30% OFF + FREE 4-PACKS / WITH EVERY $100 / red pill, then HOW IT
// WORKS in three steps. Deep-purple panel on the cream field. Shown only
// while MEGA_SALE_ENABLED is true; nothing hides by date.

import { MEGA_COPY } from "../lib/megaSale";
import { MEGA_SALE_ENABLED } from "../lib/sale";
import "./MegaSaleBlock.css";

/** Keep "4-pack(s)" on one line (phones broke "FREE 4-" / "packs"). */
function nb(text: string) {
  return text.split(/(\d+-PACKS?|\d+-packs?)/).map((part, i) =>
    i % 2 ? (
      <span key={i} style={{ whiteSpace: "nowrap" }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

// Simple line-art step icons (bag, gift, can), as in the email.
const ICONS = [
  <g key="bag">
    <path d="M14 18h20l-1.6 20H15.6Z" />
    <path d="M19 18v-3a5 5 0 0 1 10 0v3" />
  </g>,
  <g key="gift">
    <rect x="11" y="19" width="26" height="7" rx="1.2" />
    <path d="M13 26v12h22V26M24 19v19" />
    <path d="M24 19c-2-5-9-6.5-9-2.2 0 2.2 4.5 2.2 9 2.2ZM24 19c2-5 9-6.5 9-2.2 0 2.2-4.5 2.2-9 2.2Z" />
  </g>,
  <g key="can">
    <path d="M17 13h14l1 3v19l-1 3H17l-1-3V16Z" />
    <path d="M16 16h16M16 35h16" />
  </g>,
];

export function MegaSaleBlock({ className = "" }: { className?: string }) {
  if (!MEGA_SALE_ENABLED) return null;
  return (
    <section className={`mega-block-section ${className}`.trim()} aria-labelledby="mega-block-title">
      <div className="container">
        <div className="mega-block">
          <h2 id="mega-block-title" className="mega-block-head">
            <span className="mega-block-title">{MEGA_COPY.title}</span>
            <span className="mega-block-kicker">{MEGA_COPY.kicker}</span>
            <span className="mega-block-big">
              {MEGA_COPY.big.map((line) => (
                <span key={line} className="mega-block-big-line">
                  {line}
                </span>
              ))}
            </span>
            <span className="mega-block-every">{MEGA_COPY.every}</span>
          </h2>
          <p className="mega-block-pill">{MEGA_COPY.pill}</p>
          <div className="mega-block-how">
            <h3 className="mega-block-how-title">{MEGA_COPY.howTitle}</h3>
            <ol className="mega-block-steps">
              {MEGA_COPY.steps.map((s, i) => (
                <li key={i} className="mega-block-step">
                  <span className="mega-block-ring" aria-hidden="true">
                    <svg viewBox="0 0 48 48" focusable="false">
                      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        {ICONS[i]}
                      </g>
                    </svg>
                    <span className="mega-block-num">{i + 1}</span>
                  </span>
                  <span className="mega-block-step-text">
                    <span className="mega-block-step-title">{nb(s.title)}</span>
                    <span className="mega-block-step-sub">{s.sub}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
