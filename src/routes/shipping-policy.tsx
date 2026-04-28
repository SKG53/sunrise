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
          "How SUNRISE Beverage processes, ships, and delivers your order. Adult signature 21+ required at delivery. Continental US only; restricted-state list updated as regulations change.",
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
// parallel to .pp-*, .rp-*, .tos-*, .av-*, .sm-*, .acc-*. Tier-30 green
// is the Support/Policy category color shared across all policy pages.
function ShippingPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
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
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="sp-policy-body">
                <h3 className="sp-policy-heading">Where we ship</h3>
                <p>
                  SUNRISE Beverage ships to addresses within the continental
                  United States only, pursuant to applicable federal, state,
                  and local regulations restricting the shipment of
                  hemp-derived cannabinoid products. We do not ship to P.O.
                  boxes, APO/FPO military addresses, U.S. territories, Alaska,
                  or Hawaii.
                </p>
                <p>
                  Hemp-derived Delta-9 THC products are subject to
                  state-by-state regulations that continue to evolve. We
                  follow local regulations, and shipment to all 50 states is
                  not possible at this time.{" "}
                  <strong>
                    As of the effective date of this Shipping Policy, we are
                    unable to ship to the following states:
                  </strong>
                </p>
                <ul className="sp-policy-list">
                  <li>Alaska</li>
                  <li>California</li>
                  <li>Colorado</li>
                  <li>Delaware</li>
                  <li>Hawaii</li>
                  <li>Idaho</li>
                  <li>New York</li>
                  <li>North Dakota</li>
                  <li>Oregon</li>
                  <li>Rhode Island</li>
                  <li>Utah</li>
                  <li>Vermont</li>
                  <li>Washington</li>
                </ul>
                <p>
                  This list is updated as state laws change. If your shipping
                  address is in a state where we cannot deliver, you will be
                  notified at checkout and your order will not be processed.
                </p>

                <h3 className="sp-policy-heading">Adult signature required (21+)</h3>
                <p>
                  All deliveries of SUNRISE products require an adult
                  signature from a person 21 years of age or older. The signer
                  must:
                </p>
                <ul className="sp-policy-list">
                  <li>Be present at the time of delivery;</li>
                  <li>Be 21 years of age or older;</li>
                  <li>
                    Present a valid government-issued photo ID confirming age,
                    if requested by the carrier; and
                  </li>
                  <li>Sign for the package using their legal name.</li>
                </ul>
                <p>
                  If no qualifying adult is available at the delivery address,
                  the carrier will leave a notice and attempt redelivery
                  (typically up to three times). After unsuccessful delivery
                  attempts, the package will be returned to us.{" "}
                  <strong>
                    Packages returned to SUNRISE due to a failed
                    adult-signature requirement will be refunded for the
                    product cost only; original and return shipping fees are
                    non-refundable.
                  </strong>
                </p>
                <p>
                  The carrier — not SUNRISE — performs the age check at
                  delivery. Please ensure that someone 21 or older is
                  available at the shipping address you provide.
                </p>

                <h3 className="sp-policy-heading">Carriers and processing time</h3>
                <p>
                  We ship via FedEx and UPS. The specific carrier for each
                  shipment is selected based on destination, order size,
                  speed, and regulatory requirements.
                </p>
                <p>
                  Please allow up to 72 hours (three business days) for us to
                  process your order after it is placed. Orders are not
                  processed or shipped on weekends or federal holidays. During
                  periods of high order volume or promotional events,
                  processing may be delayed by an additional one to two
                  business days.
                </p>
                <p>
                  If you have not received an order confirmation email within
                  24 hours of placing your order, or if your product has not
                  arrived ten (10) business days after placing your order,
                  please reach out to us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  or <a href="tel:+18776747459">(877) 674-7459</a> and we will
                  look into it.
                </p>

                <h3 className="sp-policy-heading">Shipping speeds and rates</h3>
                <p>
                  Available shipping speeds and the associated rates are
                  shown at checkout before you complete your order. Rates are
                  calculated based on the destination address, the size of
                  your order, and the speed you select. Free or discounted
                  shipping promotions, when available, will be reflected at
                  checkout.
                </p>

                <h3 className="sp-policy-heading">Hot-weather and seasonal shipping</h3>
                <p>
                  During warm-weather months (typically May through
                  September), we may use insulated packaging and ice packs at
                  no additional cost to help maintain product quality. During
                  periods of extreme heat, we may also delay shipments by one
                  or two business days to avoid weekend transit. We are not
                  responsible for product temperature changes that occur
                  after delivery; we recommend bringing products indoors
                  promptly upon arrival.
                </p>

                <h3 className="sp-policy-heading">Tracking your order</h3>
                <p>
                  Once your order ships, you will receive a confirmation
                  email with carrier tracking information. You can track the
                  status of your shipment directly through the carrier's
                  tracking page using the tracking number provided.
                </p>

                <h3 className="sp-policy-heading">Damaged or defective product</h3>
                <p>
                  We take care in packaging and shipping your product. If
                  your order arrives damaged, leaking, or defective in any
                  way, please reach out to us at{" "}
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
                  within ten (10) business days of placing your order and we
                  will work with you to resolve the situation.
                </p>

                <h3 className="sp-policy-heading">Address accuracy and modifications</h3>
                <p>
                  Please review your shipping address carefully before
                  submitting your order. We are not able to redirect or
                  refund orders shipped to an incorrect address provided at
                  checkout.
                </p>
                <p>
                  If you need to modify the shipping address on an order that
                  has not yet been processed, please contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  immediately. We will make best efforts to accommodate your
                  request, but we cannot guarantee modifications once an
                  order is in fulfillment.
                </p>

                <h3 className="sp-policy-heading">Refused deliveries</h3>
                <p>
                  If you refuse delivery of your order for any reason other
                  than damage or defect, the package will be returned to us.{" "}
                  <strong>
                    Packages refused at delivery are eligible for a refund of
                    the product cost only; original and return shipping fees
                    are non-refundable.
                  </strong>
                </p>

                <h3 className="sp-policy-heading">State-law changes during transit</h3>
                <p>
                  Hemp regulations change frequently. If a destination
                  state's laws change such that we are unable to lawfully
                  complete delivery while your order is in transit, we will
                  work with the carrier to return the order to us and refund
                  the purchase price (less any non-refundable shipping fees).
                </p>

                <h3 className="sp-policy-heading">Contact</h3>
                <p>
                  Questions about this Shipping Policy or about a specific
                  order can be sent to{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  . You may also call us at{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>.
                </p>
                <p className="sp-policy-address">
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
