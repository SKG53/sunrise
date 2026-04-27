// Dark 5-column footer: Logo+Signup | Shop | Company | Support | Follow.
// Disclaimer row + legal bar. Copy locked from brand docs.

import { useEffect, useRef, useState } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";

export function SiteFooter() {
  const wmRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setStatusMsg("");
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setStatusMsg(data?.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setStatusMsg("Cheers! You’re on the list. ☀️");
      setEmail("");
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please try again.");
    }
  };

  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(base * 0.9, "cream");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-row-main">
          {/* ── Brand + signup column ── */}
          <div className="footer-brand-col">
            <div className="wordmark-slot" ref={wmRef} />
            <div className="footer-signup">
              <div className="signup-label">Stay in the Know</div>
              {status === "success" ? (
                <div className="signup-success" role="status" aria-live="polite">
                  {statusMsg}
                </div>
              ) : (
                <form className="signup-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    className="signup-input"
                    placeholder="Email address"
                    aria-label="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                  />
                  <button type="submit" className="signup-btn" disabled={status === "submitting"}>
                    {status === "submitting" ? "..." : "Subscribe"}
                  </button>
                </form>
              )}
              {status === "error" && (
                <div className="signup-error" role="alert">{statusMsg}</div>
              )}
            </div>
          </div>

          {/* ── Shop column ── */}
          <div className="footer-col">
            <div className="footer-col-label">Shop</div>
            <ul>
              <li><a href="/products">All Products</a></li>
              <li><a href="/products?tier=5">5mg THC</a></li>
              <li><a href="/products?tier=10">10mg THC</a></li>
              <li><a href="/products?tier=30">30mg THC</a></li>
              <li><a href="/products?tier=60">60mg THC</a></li>
              <li><a href="/find">Find Near You</a></li>
            </ul>
          </div>

          {/* ── Company column ── */}
          <div className="footer-col">
            <div className="footer-col-label">Company</div>
            <ul>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/contact?topic=wholesale">Wholesale</a></li>
              <li><a href="/contact?topic=press">Press</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>

          {/* ── Support column ── */}
          <div className="footer-col">
            <div className="footer-col-label">Support</div>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Shipping</a></li>
              <li><a href="/returns">Returns</a></li>
              <li><a href="#">Track Order</a></li>
              <li><a href="https://marketing8710.wixstudio.com/beverage-manufacture/blank" target="_blank" rel="noopener noreferrer">COAs</a></li>
              <li><a href="#">Age Verification</a></li>
            </ul>
          </div>

          {/* ── Follow column ── */}
          <div className="footer-col footer-follow-col">
            <div className="footer-col-label">Follow</div>
            <div className="footer-social">
              <a href="#" aria-label="Instagram">
                <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <span>Instagram</span>
              </a>
              <a href="#" aria-label="TikTok">
                <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>
                <span>TikTok</span>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="footer-disclaimer">
          <div className="footer-disclaimer-inner">
            Hemp-derived Delta-9 THC products. For adults 21 and over. Do not drive or operate machinery after consumption. Keep out of reach of children and pets. These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. Contains hemp-derived cannabinoids. Compliant with the 2018 Farm Bill.
          </div>
        </div>

        {/* ── Legal bar ── */}
        <div className="footer-legal">
          <div className="footer-copyright">© 2026 SUNRISE Beverage. All Rights Reserved.</div>
          <div className="footer-legal-links">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Accessibility</a>
            <a href="#">Do Not Sell My Info</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
