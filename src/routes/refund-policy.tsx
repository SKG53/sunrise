import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./refund-policy.css";

export const Route = createFileRoute("/refund-policy")({
  component: RefundPolicyPage,
  head: () => ({
    meta: [
      { title: "Refund Policy · SUNRISE" },
      {
        name: "description",
        content:
          "SUNRISE does not accept returns on beverage or other edible products. If something is wrong with your order — damaged, defective, or incorrect — get in touch and we'll make it right.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/refund-policy" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
function RefundPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        {/* Tier-30 green flood — page-identity color for Support category. */}
        {/* Same structural pattern as About / Contact / Find / Products    */}
        {/* pageheroes (giant color flood + animated character entrance).   */}
        <section className="rp-pagehero">
          <h1 className="rp-pagehero-title" aria-label="Support">
            {"Support".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        {/* Page-title (H2) orients the user inside the Support category;  */}
        {/* policy body follows. Long-form reading width (~68ch) — wider    */}
        {/* than About's intro (64ch) since policy content is denser.       */}
        {/* No closer color-flood / no PTP — policy pages are utility,     */}
        {/* not marketing. The footer provides natural page closure.       */}
        <section className="rp-policy">
          <div className="container">
            <div className="rp-policy-inner">
              <h2 className="rp-policy-title">Refund Policy</h2>

              <div className="rp-policy-body">
                <h3 className="rp-policy-heading">Our policy</h3>
                <p>
                  SUNRISE does not accept returns on beverage or other edible
                  products. Once a sealed item has left our facility, food
                  safety standards prevent us from putting it back into
                  circulation.
                </p>
                <p>
                  That said, if something is wrong with your order, get in
                  touch. We don't process formal returns or exchanges, but we
                  handle every issue individually and work to make it right.
                </p>

                <h3 className="rp-policy-heading">Damaged or defective product</h3>
                <p>
                  If your order arrived damaged, leaking, or otherwise
                  defective, contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  within 48 hours of delivery. Please include:
                </p>
                <ul className="rp-policy-list">
                  <li>Your order number</li>
                  <li>A clear photo of the damaged or defective product</li>
                  <li>A photo of the shipping box, especially if the damage happened in transit</li>
                  <li>A short description of the issue</li>
                </ul>
                <p>
                  We respond within one business week. Resolutions vary by
                  situation — typically replacement or refund — and we'll work
                  out what fits best with you.
                </p>
                <p>
                  Damage claims received outside the 48-hour window cannot be
                  guaranteed.
                </p>

                <h3 className="rp-policy-heading">Wrong product received</h3>
                <p>
                  If we shipped the wrong flavor, tier, or quantity, contact
                  us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  with your order number and a photo of what arrived. We will
                  work with you to resolve the issue and make sure you receive
                  the correct product as ordered.
                </p>

                <h3 className="rp-policy-heading">Exchanges</h3>
                <p>
                  We don't process formal exchanges, but if something isn't
                  working for you, reach out to{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  and tell us about the issue. We'll work with you to find the
                  best alternative.
                </p>

                <h3 className="rp-policy-heading">Purchased from a retailer</h3>
                <p>
                  If you bought SUNRISE at a store, gas station, dispensary,
                  or any other third-party retailer, return and refund
                  decisions are handled by that retailer under their own
                  policy. We are not able to process complaints for purchases
                  made outside{" "}
                  <a href="https://www.savorsunrise.com">www.savorsunrise.com</a>.
                </p>

                <h3 className="rp-policy-heading">Refunds</h3>
                <p>
                  When a refund is approved, it will be processed to your
                  original payment method within 10 business days. Please
                  allow additional time for your bank or card issuer to post
                  the refund on their end. If more than two business weeks
                  have passed since approval and the refund still has not
                  appeared, contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  and we will look into it.
                </p>
                <p>
                  Shipping fees are not eligible for refund unless
                  specifically agreed upon in our conversations with you.
                </p>

                <h3 className="rp-policy-heading">Contact</h3>
                <p className="rp-policy-contact-line">
                  Email:{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                </p>
                <p className="rp-policy-contact-line">
                  Response window: one business week
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}