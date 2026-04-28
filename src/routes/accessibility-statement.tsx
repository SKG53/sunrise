import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./accessibility-statement.css";

export const Route = createFileRoute("/accessibility-statement")({
  component: AccessibilityStatementPage,
  head: () => ({
    meta: [
      { title: "Accessibility Statement · SUNRISE" },
      {
        name: "description",
        content:
          "SUNRISE Beverage's commitment to web accessibility. We aim for WCAG 2.1 Level AA conformance and welcome feedback on accessibility barriers.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://savorsunrise.com/accessibility-statement",
      },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
// New route as of v2 of the policy cluster. Class prefix .acc-* (3 chars
// to avoid collision with any future 2-char .ac-* utility). Hero word:
// "Accessibility" (13 chars). Linked from the right-corner footer-legal
// row (Privacy / Accessibility / Terms of Service).
function AccessibilityStatementPage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="acc-pagehero">
          <h1 className="acc-pagehero-title" aria-label="Accessibility">
            {"Accessibility".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </h1>
        </section>

        {/* ── 02 · POLICY ──────────────────────────────────────────────── */}
        <section className="acc-policy">
          <div className="container">
            <div className="acc-policy-inner">
              <h2 className="acc-policy-title">Accessibility Statement</h2>

              <p className="acc-policy-effective">
                <strong>Last updated:</strong> April 28, 2026
              </p>

              <div className="acc-policy-body">
                <h3 className="acc-policy-heading">Our commitment</h3>
                <p>
                  SUNRISE Beverage is committed to ensuring that our website
                  is accessible to everyone, including individuals with
                  disabilities. We strive to provide a website that is usable
                  by the widest possible audience, regardless of ability,
                  technology, or device.
                </p>

                <h3 className="acc-policy-heading">Conformance status</h3>
                <p>
                  We aim for our website to conform to the{" "}
                  <a
                    href="https://www.w3.org/TR/WCAG21/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Web Content Accessibility Guidelines (WCAG) 2.1 Level AA
                  </a>
                  , published by the World Wide Web Consortium (W3C). These
                  guidelines explain how to make web content more accessible
                  for people with disabilities and more user-friendly for
                  everyone.
                </p>
                <p>
                  While we work to maintain conformance with these standards,
                  some content on our website may not yet fully comply. We
                  are actively working to identify and address any areas of
                  non-conformance.
                </p>

                <h3 className="acc-policy-heading">Accessibility features</h3>
                <p>
                  We have taken the following steps to improve accessibility
                  on our website:
                </p>
                <ul className="acc-policy-list">
                  <li>Alternative text descriptions for non-decorative images</li>
                  <li>Logical heading structure to support screen readers</li>
                  <li>Sufficient color contrast between text and background</li>
                  <li>Keyboard navigation support throughout the site</li>
                  <li>Descriptive link text and form labels</li>
                  <li>Resizable text without loss of functionality</li>
                  <li>
                    Compatibility with major assistive technologies, including
                    screen readers (such as JAWS, NVDA, and VoiceOver)
                  </li>
                  <li>ARIA labels on interactive elements where appropriate</li>
                </ul>

                <h3 className="acc-policy-heading">Ongoing efforts</h3>
                <p>
                  Web accessibility is an ongoing effort. We regularly review
                  our website to identify and resolve accessibility issues,
                  and we incorporate accessibility considerations into the
                  design and development of new features. We provide
                  accessibility training to our team and work with our
                  website platform provider (Shopify) to take advantage of
                  platform-level accessibility improvements.
                </p>

                <h3 className="acc-policy-heading">Third-party content</h3>
                <p>
                  Some content on our website may be provided by third
                  parties (such as embedded videos, social media feeds, or
                  partner content). We do not control the accessibility of
                  third-party content, but we encourage our partners to
                  provide accessible experiences. If you encounter
                  inaccessible third-party content on our website, please let
                  us know so we can work with the provider on a solution.
                </p>

                <h3 className="acc-policy-heading">Feedback and assistance</h3>
                <p>
                  We welcome feedback on the accessibility of our website. If
                  you encounter an accessibility barrier, have a suggestion
                  for improvement, or need assistance accessing any part of
                  our website or completing a purchase, please contact us:
                </p>
                <ul className="acc-policy-list">
                  <li>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>{" "}
                    (subject line: "Accessibility")
                  </li>
                  <li>
                    <strong>Phone:</strong>{" "}
                    <a href="tel:+18776747459">(877) 674-7459</a>
                  </li>
                  <li>
                    <strong>Mail:</strong>
                    <p className="acc-policy-address">
                      SUNRISE Beverage — Attn: Accessibility<br />
                      2032 Utica Square, Unit #52521<br />
                      Tulsa, OK 74114<br />
                      United States
                    </p>
                  </li>
                </ul>
                <p>
                  We aim to respond to accessibility inquiries within five
                  (5) business days. If you need assistance placing an order,
                  our team can take your order over the phone or via email.
                </p>

                <h3 className="acc-policy-heading">Formal complaints</h3>
                <p>
                  If you have a formal complaint about the accessibility of
                  our website that we have been unable to resolve, you may
                  submit it in writing to the address above with the subject
                  line "Accessibility Complaint." We will investigate and
                  respond within thirty (30) days.
                </p>

                <h3 className="acc-policy-heading">Continuous improvement</h3>
                <p>
                  This Accessibility Statement reflects our current
                  accessibility status and ongoing commitment. We will update
                  this statement as our practices evolve and as we continue
                  to improve the accessibility of our website.
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
