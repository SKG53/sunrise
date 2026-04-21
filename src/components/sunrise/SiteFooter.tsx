import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">

        <div className="footer-tagline">Refresh the Way the World Drinks</div>

        <div className="footer-divider"></div>

        <div className="footer-row">
          <div className="footer-wordmark-col">
            <div className="footer-wordmark-slot">
              <Wordmark size={32} mode="cream" />
            </div>
            <div className="company-line">
              Brand in a Box, LLC<br />
              Tulsa, Oklahoma · USA
            </div>
          </div>

          <div className="footer-links">
            <a href="#">Home</a>
            <a href="#">Products</a>
            <a href="#">About</a>
            <a href="#">Near You</a>
            <a href="#">Contact</a>
          </div>
        </div>

        <div className="footer-legal">
          <p>
            Hemp-derived Delta-9 THC products. For adults 21 and over. Do not drive or operate machinery after consumption. Keep out of reach of children and pets. These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. Contains hemp-derived cannabinoids. Compliant with the 2018 Farm Bill.
          </p>
          <div className="copyright">© 2026 SUNRISE</div>
        </div>

      </div>
    </footer>
  );
}