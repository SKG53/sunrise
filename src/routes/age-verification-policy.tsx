import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./age-verification-policy.css";

export const Route = createFileRoute("/age-verification-policy")({
  component: AgeVerificationPolicyPage,
  head: () => ({
    meta: [
      { title: "Age Verification Policy · SUNRISE" },
      {
        name: "description",
        content:
          "How SUNRISE Beverage verifies that purchasers are 21 or older. Three layers of verification: at site entry, at checkout, and at delivery.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://savorsunrise.com/age-verification-policy",
      },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// New route as of v2 of the policy cluster. Structural mirror of the four
// existing policy pages (privacy, refund, shipping, terms). Class prefix
// .av-* parallel to .pp-*, .rp-*, .sp-*, .tos-*. Tier-30 green pagehero.
// 16-character "Age Verification" hero title (with non-breaking space
// between words to match the rendering pattern of single-word heroes).
function AgeVerificationPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="av-pagehero">
          <h1 className="av-pagehero-title" aria-label="Age Verification">
            {"Age Verification".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="av-policy">
          <div className="container">
            <div className="av-policy-inner">
              <h2 className="av-policy-title">Age Verification Policy</h2>

              <p className="av-policy-effective">
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="av-policy-body">
                <h3 className="av-policy-heading">Our commitment</h3>
                <p>
                  SUNRISE Beverage products are intended exclusively for
                  adults 21 years of age and older. We take age verification
                  seriously and use multiple layers of verification to ensure
                  that our products do not reach minors.
                </p>

                <h3 className="av-policy-heading">How we verify age</h3>

                <h4 className="av-policy-subheading">1. At site entry</h4>
                <p>
                  When you visit www.savorsunrise.com for the first time, you
                  will be asked to confirm that you are 21 years of age or
                  older before you can browse the site. By clicking "I am
                  21+," you represent that you have read and agree to our{" "}
                  <a href="/terms-of-service">Terms of Service</a> and{" "}
                  <a href="/privacy-policy">Privacy Policy</a>.
                </p>

                <h4 className="av-policy-subheading">2. At checkout</h4>
                <p>
                  When you place an order, we use a third-party
                  age-verification service to confirm that the purchaser is
                  21 or older. You may be asked to provide:
                </p>
                <ul className="av-policy-list">
                  <li>Your date of birth</li>
                  <li>Your billing or shipping address</li>
                  <li>
                    In some cases, a photograph of a valid government-issued
                    identification document
                  </li>
                </ul>
                <p>
                  The verification is performed by our third-party provider,
                  which uses encrypted data-handling practices and securely
                  matches your information against authoritative records.{" "}
                  <strong>
                    SUNRISE Beverage does not directly store images of your
                    government-issued identification document.
                  </strong>{" "}
                  Once your age is verified, you generally will not need to
                  verify again on the same device.
                </p>
                <p>
                  If verification fails, you may be asked to submit additional
                  information or your order may be cancelled. If your order
                  is cancelled because age verification could not be
                  completed, you will receive a full refund.
                </p>

                <h4 className="av-policy-subheading">3. At delivery</h4>
                <p>
                  All SUNRISE shipments require an{" "}
                  <strong>
                    adult signature from a person 21 years of age or older
                  </strong>{" "}
                  at delivery. The shipping carrier will check ID at delivery
                  and will not release the package to anyone under 21 or to
                  anyone who refuses to provide ID.
                </p>
                <p>
                  If a qualifying adult is not available to sign after the
                  carrier's redelivery attempts, the package will be returned
                  to us, and you will be refunded for the product cost (less
                  non-refundable shipping fees). See our{" "}
                  <a href="/shipping-policy">Shipping Policy</a> for full
                  details.
                </p>

                <h3 className="av-policy-heading">Information we collect for age verification</h3>
                <p>For age-verification purposes, we may collect:</p>
                <ul className="av-policy-list">
                  <li>Date of birth</li>
                  <li>
                    Name and address (for matching against authoritative
                    records)
                  </li>
                  <li>
                    A photograph of a government-issued identification
                    document (in some cases)
                  </li>
                  <li>
                    A device fingerprint (used to remember verified devices
                    and reduce repeat verification)
                  </li>
                </ul>
                <p>
                  This information is collected by our third-party
                  verification provider and used solely for the purposes of
                  verifying your age and complying with applicable law. See
                  our <a href="/privacy-policy">Privacy Policy</a> for full
                  details on how this information is handled.
                </p>

                <h3 className="av-policy-heading">If you are under 21</h3>
                <p>
                  If you are under 21 years of age, you are not permitted to
                  use this website or purchase our products. If you are a
                  parent or guardian and you believe a person under 21 has
                  provided personal information to us, please contact us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  and we will take prompt steps to delete that information.
                </p>

                <h3 className="av-policy-heading">Compliance with law</h3>
                <p>
                  Our age-verification practices are designed to comply with
                  applicable federal and state laws governing the sale of
                  hemp-derived cannabinoid products, including the
                  Agriculture Improvement Act of 2018 (the "2018 Farm Bill"),
                  state hemp laws, and applicable consumer-protection
                  regulations. State and local laws change frequently; we
                  update our verification practices and our list of
                  serviceable shipping destinations as needed.
                </p>

                <h3 className="av-policy-heading">Contact</h3>
                <p>
                  Questions about this Age Verification Policy can be sent to{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  or <a href="tel:+18776747459">(877) 674-7459</a>.
                </p>
                <p className="av-policy-address">
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
