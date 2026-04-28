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
// Pagehero word changed from "Support" → "Refund" per founder direction
// (every policy page hero word matches its policy name).
function RefundPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="rp-pagehero">
          <h1 className="rp-pagehero-title" aria-label="Refund">
            {"Refund".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="rp-policy">
          <div className="container">
            <div className="rp-policy-inner">
              <h2 className="rp-policy-title">Refund Policy</h2>

              <p className="rp-policy-effective">
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="rp-policy-body">
                <h3 className="rp-policy-heading">Our policy</h3>
                <p>
                  SUNRISE Beverage does not accept returns on beverage or
                  other edible products. Once a sealed item has left our
                  facility, food-safety standards prevent us from putting it
                  back into circulation.
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
                  We respond within five (5) business days. Resolutions vary
                  by situation — typically replacement or refund — and we'll
                  work out what fits best with you.
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

                <h3 className="rp-policy-heading">Order cancellation</h3>
                <p>
                  We process and ship orders quickly. If you need to cancel an
                  order, contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  immediately after placing it. We will make best efforts to
                  cancel before fulfillment, but we cannot guarantee
                  cancellations once an order is in fulfillment. Once an order
                  has shipped, it cannot be cancelled.
                </p>

                <h3 className="rp-policy-heading">Failed adult-signature delivery</h3>
                <p>
                  All SUNRISE deliveries require an adult signature from a
                  person 21 or older. If your package is returned to us
                  because no qualifying adult was available to sign after the
                  carrier's redelivery attempts, you will be refunded for the
                  product cost only.{" "}
                  <strong>
                    Original and return shipping fees are non-refundable in
                    this circumstance.
                  </strong>{" "}
                  See our <a href="/shipping-policy">Shipping Policy</a> for
                  full details.
                </p>

                <h3 className="rp-policy-heading">Refused deliveries</h3>
                <p>
                  If you refuse delivery of your order for any reason other
                  than damage or defect, the package will be returned to us.{" "}
                  <strong>
                    Packages refused at delivery are eligible for a refund of
                    the product cost only; original and return shipping fees
                    are non-refundable.
                  </strong>
                </p>

                <h3 className="rp-policy-heading">Lost packages</h3>
                <p>
                  If you believe your package has been lost or never
                  delivered, please contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  within ten (10) business days of placing your order. We will
                  work with the carrier and with you to investigate and, where
                  appropriate, issue a replacement or refund.
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
                  original payment method within ten (10) business days.
                  Please allow additional time for your bank or card issuer to
                  post the refund on their end. If more than two (2) business
                  weeks have passed since approval and the refund still has
                  not appeared, contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  and we will look into it.
                </p>
                <p>
                  Shipping fees are not eligible for refund unless
                  specifically agreed upon in our conversations with you.
                </p>

                <h3 className="rp-policy-heading">Chargebacks and payment disputes</h3>
                <p>
                  We ask that you contact us first before initiating a
                  chargeback or payment dispute. Most issues can be resolved
                  more quickly through direct communication. If you initiate a
                  chargeback for a transaction without first contacting us, we
                  may dispute the chargeback with documentation of your order,
                  delivery, and any communications.
                </p>

                <h3 className="rp-policy-heading">Contact</h3>
                <p className="rp-policy-contact-line">
                  Email:{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                </p>
                <p className="rp-policy-contact-line">
                  Phone:{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>
                </p>
                <p className="rp-policy-contact-line">
                  Response window: five (5) business days
                </p>
                <p className="rp-policy-address">
                  SUNRISE Beverage<br />
                  2032 Utica Square, Unit #52521<br />
                  Tulsa, OK 74114<br />
                  United States
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
