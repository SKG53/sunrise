// Site-wide free-shipping announcement bar. Mounted in __root.tsx so it
// renders above the sticky header on every route — including product detail
// pages, policy pages, and the 404 fallback.
//
// Static and non-sticky: it scrolls away on scroll while the header pins
// beneath it. Non-dismissible — the $75 free-shipping threshold is evergreen
// standing info, not a dated promotion. The whole bar links to /products.
//
// Solid gold field, near-black text. Styling lives in sunrise-shell.css under
// the ANNOUNCEMENT BAR block.

export function AnnouncementBar() {
  return (
    <a className="announcement-bar" href="/products">
      Free shipping on all orders{" "}
      <span className="announcement-bar-emph">$75+</span>
    </a>
  );
}