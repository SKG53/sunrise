import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./sms-marketing-policy.css";

export const Route = createFileRoute("/sms-marketing-policy")({
  component: SmsMarketingPolicyPage,
  head: () => ({
    meta: [
      { title: "SMS Marketing Policy · SUNRISE" },
      {
        name: "description",
        content:
          "Terms governing your subscription to and use of SUNRISE Beverage's recurring text-message marketing program. Includes opt-in/opt-out, message frequency, eligibility, and dispute resolution.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://savorsunrise.com/sms-marketing-policy",
      },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// New route as of v2 of the policy cluster. Class prefix .sm-* (distinct
// from .sp-* shipping). Hero word: "Marketing" (9 chars).
function SmsMarketingPolicyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="sm-pagehero">
          <h1 className="sm-pagehero-title" aria-label="Marketing">
            {"Marketing".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="sm-policy">
          <div className="container">
            <div className="sm-policy-inner">
              <h2 className="sm-policy-title">SMS Marketing Policy</h2>

              <p className="sm-policy-effective">
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="sm-policy-body">
                <p>
                  These SMS Marketing Terms ("SMS Terms") govern your
                  subscription to and use of SUNRISE Beverage's recurring
                  text-message marketing program (the "Program"). The Program
                  is provided by SUNRISE Beverage, 2032 Utica Square, Unit
                  #52521, Tulsa, OK 74114. By providing your mobile telephone
                  number and opting in to the Program, you agree to these SMS
                  Terms, our <a href="/privacy-policy">Privacy Policy</a>, and
                  our <a href="/terms-of-service">Terms of Service</a>.
                </p>

                <h3 className="sm-policy-heading">Consent</h3>
                <p>
                  By providing your mobile telephone number to us and
                  submitting any opt-in form (whether on our website, at
                  checkout, in store, or at an event), you expressly consent
                  to receive recurring marketing and promotional text
                  messages — including those sent using an automatic
                  telephone dialing system or pre-recorded voice message —
                  from SUNRISE Beverage at the number provided.
                </p>
                <p>
                  <strong>
                    Consent to receive marketing text messages is not required
                    as a condition of any purchase.
                  </strong>
                </p>
                <p>
                  You represent that you are the subscriber or authorized
                  user of the mobile number you provide and that you are at
                  least 21 years of age. You also represent that you are
                  responsible for any charges associated with text messages
                  sent to your number.
                </p>

                <h3 className="sm-policy-heading">Message frequency</h3>
                <p>
                  Message frequency varies. You may receive up to ten (10)
                  marketing messages per month, though actual frequency may
                  be higher or lower depending on promotions, product
                  launches, and other events.
                </p>

                <h3 className="sm-policy-heading">Message and data rates</h3>
                <p>
                  Message and data rates may apply, depending on your mobile
                  carrier and plan. SUNRISE Beverage is not responsible for
                  any charges or fees imposed by your mobile carrier in
                  connection with your participation in the Program. Please
                  consult your mobile carrier for details.
                </p>

                <h3 className="sm-policy-heading">How to opt out</h3>
                <p>
                  You can opt out of the Program at any time by replying{" "}
                  <strong>STOP</strong> to any text message we send. After
                  you reply STOP, you will receive a confirmation message and
                  will not receive further marketing texts from the Program.{" "}
                  <strong>
                    It may take up to 24 hours for your opt-out to be fully
                    processed across our systems.
                  </strong>
                </p>
                <p>
                  You can also opt out by contacting us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                  or <a href="tel:+18776747459">(877) 674-7459</a> with your
                  mobile number and a request to unsubscribe.
                </p>
                <p>
                  After opting out, you may still receive non-marketing
                  communications, such as messages relating to a specific
                  order, customer service responses, or important account
                  notifications.
                </p>

                <h3 className="sm-policy-heading">Help</h3>
                <p>
                  For help, reply <strong>HELP</strong> to any of our text
                  messages, email us at{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  , or call us at{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>.
                </p>

                <h3 className="sm-policy-heading">Carrier support</h3>
                <p>
                  We send messages through the major U.S. mobile carriers.
                  Carriers are not liable for delayed or undelivered
                  messages.
                </p>

                <h3 className="sm-policy-heading">Privacy</h3>
                <p>
                  We respect your privacy. We will use the information you
                  provide in accordance with our{" "}
                  <a href="/privacy-policy">Privacy Policy</a>. We do not sell
                  mobile information collected as part of the Program.
                </p>

                <h3 className="sm-policy-heading">Eligibility and restrictions</h3>
                <p>
                  The Program is available to U.S. residents 21 years of age
                  or older with a U.S. mobile telephone number. The Program
                  is not available outside the United States. You must use a
                  mobile number that you own or are authorized to use. The
                  Program may not be available on all carriers or all
                  devices.
                </p>

                <h3 className="sm-policy-heading">Modifications</h3>
                <p>
                  We reserve the right to modify or terminate the Program at
                  any time. We will post any changes to these SMS Terms on
                  this page and update the "Last updated" date.
                </p>

                <h3 className="sm-policy-heading">Disputes</h3>
                <p>
                  Any disputes related to the Program are governed by the
                  dispute-resolution provisions of our{" "}
                  <a href="/terms-of-service">Terms of Service</a>, including
                  the binding individual arbitration agreement, class action
                  waiver, and jury trial waiver set forth therein.
                </p>

                <h3 className="sm-policy-heading">Contact</h3>
                <p className="sm-policy-address">
                  SUNRISE Beverage<br />
                  2032 Utica Square, Unit #52521<br />
                  Tulsa, OK 74114<br />
                  Email:{" "}
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                  <br />
                  Phone:{" "}
                  <a href="tel:+18776747459">(877) 674-7459</a>
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
