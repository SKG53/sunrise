import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./shipping-policy.css";

export const Route = createFileRoute("/shipping-policy")({
  component: ShippingPolicyPage,
  head: () => ({
    meta: [
      { title: "Shipping Policy · SUNRISE" },
      {
        name: "description",
        content:
          "How SUNRISE Beverage processes, ships, and delivers your order. Includes processing times, shipping regions, restricted destinations, and what to do if something arrives damaged or never arrives.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/shipping-policy" },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// Structural mirror of /privacy-policy, /refund-policy, /terms-of-service:
// SiteHeader → tier-30 pagehero with animated character entrance → cream
// policy body in 68ch reading column → SiteFooter. Class prefix .sp-*
// parallel to .pp-*, .rp-*, .tos-*. Tier-30 green is the Support/Policy
// category color shared across all four policy pages.
//
// Content per founder direction (deliberate omissions noted):
//   · Continental US only; no PO boxes, no APO/FPO
//   · State restrictions described generically (regulatory updates), no list
//   · No carrier names — carrier selected per order
//   · No signature requirement called out
//   · 72-hour processing window; checkout-quoted shipping speeds; 10-day
//     no-confirmation/no-delivery trigger to reach out
//   · No seasonal/heat handling section — generic "utmost care" language
//   · Damage/issue window: 48 hours; cross-reference to Refund Policy
//   · Lost / never-received / wrong-address all folded into the single
//     10-day outreach trigger — no separate scenario carve-outs
function ShippingPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        {/* Tier-30 green flood — Support/Policy category color, matching   */}
        {/* the other three policy pages. 8-character "Shipping" entrance.   */}
        <section className="sp-pagehero">
          <h1 className="sp-pagehero-title" aria-label="Shipping">
            {"Shipping".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="sp-policy">
          <div className="container">
            <div className="sp-policy-inner">
              <h2 className="sp-policy-title">Shipping Policy</h2>

              <p className="sp-policy-effective">
                <strong>Last updated:</strong> April 27, 2026
              </p>

              <div className="sp-policy-body">
                <h3 className="sp-policy-heading">Where we ship</h3>
                <p>
                  SUNRISE Beverage ships to addresses within the continental
                  United States only, pursuant to any local regulations
                  restricting the shipment of hemp-infused products. We do
                  not ship to P.O. boxes or APO/FPO military addresses.
                </p>
                <p>
                  Hemp-derived Delta-9 THC products are subject to
                  state-by-state regulations that continue to evolve. We
                  follow local regulations, and shipment to all 50 states is
                  not possible at this time. Our list of serviceable states
                  will be updated as regulatory information is updated. If we
                  are unable to ship to your address, you will be notified at
                  checkout.
                </p>

                <h3 className="sp-policy-heading">Processing time</h3>
                <p>
                  Please allow up to 72 hours for us to process your order
                  after it is placed. Once your order is handed to the
                  carrier, the standard shipping timeline applies — the
                  specific timeline for your order will be shown at checkout
                  based on the shipping option you select.
                </p>
                <p>
                  If you have not received an order confirmation email, or
                  if your product has not arrived 10 days after placing your
                  order, please reach out to us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  and we will look into it.
                </p>

                <h3 className="sp-policy-heading">Shipping speeds and rates</h3>
                <p>
                  Available shipping speeds and the associated rates are
                  shown at checkout before you complete your order. Rates are
                  calculated based on the destination address, the size of
                  your order, and the speed you select. We choose the
                  appropriate carrier for each shipment.
                </p>

                <h3 className="sp-policy-heading">Damaged or defective product</h3>
                <p>
                  We take the utmost care in packaging and shipping your
                  product. If your order arrives damaged, leaking, or
                  defective in any way, please reach out to us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  within 48 hours of delivery. For full details on how we
                  handle damaged orders and refund eligibility, please refer
                  to our <a href="/refund-policy">Refund Policy</a>.
                </p>

                <h3 className="sp-policy-heading">Title and risk of loss</h3>
                <p>
                  Once we transfer your order to the carrier, title and risk
                  of loss pass to you. We are not liable for delays caused by
                  shipping carriers, customs processing, or other events
                  outside our control. All delivery times are estimates and
                  are not guaranteed.
                </p>
                <p>
                  If you believe your package has been lost, never delivered,
                  or you have any other concern with the status of your
                  order, please reach out to us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  within 10 days of placing your order and we will work with
                  you to resolve the situation.
                </p>

                <h3 className="sp-policy-heading">Address accuracy</h3>
                <p>
                  Please review your shipping address carefully before
                  submitting your order. We are not able to redirect or
                  refund orders shipped to an incorrect address provided at
                  checkout.
                </p>

                <h3 className="sp-policy-heading">Contact</h3>
                <p>
                  Questions about this Shipping Policy or about a specific
                  order can be sent to{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  . You may also call us at{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>.
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
