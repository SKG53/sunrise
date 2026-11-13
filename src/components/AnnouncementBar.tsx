// Site-wide announcement bar. Mounted in __root.tsx so it renders above the
// sticky header on every route — product pages, policy pages, 404.
//
// During the sale (lib/sale.ts) it flips to the sale field (.is-sale) with the
// deal in one line; otherwise the evergreen free-shipping line on gold.
// Styling lives in sunrise-shell.css under ANNOUNCEMENT BAR.

import { activeSale, SALE_ALL_LABEL } from "../lib/sale";

export function AnnouncementBar() {
  const sale = activeSale();
  if (sale) {
    return (
      <div className="announcement-bar is-sale" role="region" aria-label="Announcements">
        <div className="announcement-bar-track">
          <a href="/products" className="announcement-bar-slide is-active">
            <span className="announcement-bar-emph">{sale.pctAll}% off</span> {SALE_ALL_LABEL} ·{" "}
            <span className="announcement-bar-emph">{sale.pctTen}% off</span> 10mg
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="announcement-bar" role="region" aria-label="Announcements">
      <div className="announcement-bar-track">
        <a href="/products" className="announcement-bar-slide is-active">
          Free shipping on all orders <span className="announcement-bar-emph">$75+</span>
        </a>
      </div>
    </div>
  );
}
