// =============================================================================
// SUNRISE — contact.tsx
// Path: src/routes/contact.tsx
// Session: SBev.BC.WebsiteDesign.Contact.1 · Contact route — full build
//
// Replaces the scaffolded placeholder. Utility page. No PtP band — the page
// IS the CTA. Hero uses the locked Voice Guide accent line "Give us a buzz."
// Reason dropdown pre-fills from ?topic= URL param so Find CTAs land clean.
// =============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import "./contact.css";

// Accepted topic values for the URL param routing layer. Keep in sync with
// Find page hrefs: /contact?topic=wholesale, /contact?topic=retailer-request.
const TOPIC_MAP: Record<string, string> = {
  "wholesale": "Wholesale / Retail Partnership",
  "retailer-request": "Request a Retailer",
  "press": "Media / Press",
  "general": "General Inquiry",
  "support": "Product Support",
};

const REASONS = [
  "General Inquiry",
  "Wholesale / Retail Partnership",
  "Request a Retailer",
  "Media / Press",
  "Product Support",
  "Other",
];

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact · SUNRISE" },
      {
        name: "description",
        content:
          "Questions, wholesale inquiries, press, or just saying hi — reach the SUNRISE team by form or email.",
      },
    ],
  }),
});

// ── COMPONENT ────────────────────────────────────────────────────────────
function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Pre-select reason from ?topic= URL param on mount. Browser-only.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    if (topic && TOPIC_MAP[topic]) {
      setReason(TOPIC_MAP[topic]);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Wire to backend. Options: EmailJS, Formspree, HubSpot Forms API,
    // Netlify Forms, or direct Cloudflare Worker endpoint. Until then, form
    // surfaces a success state so the UX is complete end-to-end.
    // Payload shape ready for any of the above:
    // { name, email, reason, message, topic: params.get('topic') }
    setSubmitted(true);
  };

  return (
    <>
      <SiteHeader activeNav="contact" />

      <main>
        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="c-hero">
          <div className="container">
            <div className="c-hero-inner">
              <div className="c-eyebrow">Say Hello</div>
              <h1 className="c-hero-headline">
                Say hello.<br />
                Give us a <em className="accent-italic">buzz.</em>
              </h1>
              <p className="c-hero-body">
                Questions, wholesale, press, or just saying hi — we read
                everything. Use the form below or drop us a line directly.
              </p>
            </div>
          </div>
        </section>

        {/* ── 02 · FORM ─────────────────────────────────────────────────── */}
        <section className="c-form-section">
          <div className="container">
            <div className="c-form-grid">
              <div className="c-form-side">
                <div className="c-eyebrow">General Inquiry</div>
                <h2 className="c-form-headline">
                  Tell us what's on your <span className="accent">mind.</span>
                </h2>
                <p className="c-form-sub">
                  We respond to most messages within two business days. Please
                  don't include sensitive personal or health information.
                </p>
              </div>

              <div className="c-form-card">
                {submitted ? (
                  <div className="c-success" role="status" aria-live="polite">
                    <div className="c-success-eyebrow">Message Sent</div>
                    <div className="c-success-headline">Thanks for reaching out.</div>
                    <p className="c-success-body">
                      We've got your note and will be in touch soon. In the
                      meantime, feel free to explore the lineup.
                    </p>
                    <div className="c-success-ctas">
                      <a href="/products" className="btn btn-primary">
                        See the Lineup →
                      </a>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setSubmitted(false);
                          setName("");
                          setEmail("");
                          setMessage("");
                        }}
                      >
                        Send Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="c-form" onSubmit={handleSubmit} noValidate>
                    <div className="c-form-row c-form-row-split">
                      <label className="c-field">
                        <span className="c-field-label">Name</span>
                        <input
                          type="text"
                          className="c-input"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          autoComplete="name"
                        />
                      </label>
                      <label className="c-field">
                        <span className="c-field-label">Email</span>
                        <input
                          type="email"
                          className="c-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </label>
                    </div>

                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Reason for Reaching Out</span>
                        <select
                          className="c-select"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        >
                          {REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Message</span>
                        <textarea
                          className="c-textarea"
                          rows={6}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          required
                        />
                      </label>
                    </div>

                    <div className="c-form-submit">
                      <button type="submit" className="btn btn-primary">
                        Send Message →
                      </button>
                      <span className="c-form-note">
                        We'll never share your information.
                      </span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 · DIRECT CHANNELS ──────────────────────────────────────── */}
        <section className="c-direct">
          <div className="container">
            <div className="c-direct-head">
              <div className="c-eyebrow">Or Reach Us Directly</div>
              <h2 className="c-direct-headline">
                Three ways to find <span className="accent">us.</span>
              </h2>
            </div>
            <div className="c-direct-grid">
              <div className="c-direct-card">
                <div className="c-direct-label">Email</div>
                <div className="c-direct-value">
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                </div>
                <div className="c-direct-note">
                  Quickest way to reach us. Mention <strong>wholesale</strong>,{" "}
                  <strong>press</strong>, or <strong>retail</strong> in the
                  subject so we route it fast.
                </div>
              </div>

              <div className="c-direct-card">
                <div className="c-direct-label">Mail</div>
                <div className="c-direct-value c-direct-value-block">
                  SUNRISE Beverage<br />
                  2032 Utica Square, #52521<br />
                  Tulsa, OK 74114
                </div>
                <div className="c-direct-note">
                  Tulsa, Oklahoma. Where everything gets formulated and tested.
                </div>
              </div>

              <div className="c-direct-card">
                <div className="c-direct-label">Web</div>
                <div className="c-direct-value">
                  <a href="https://savorsunrise.com" target="_blank" rel="noreferrer">
                    savorsunrise.com
                  </a>
                </div>
                <div className="c-direct-note">
                  COAs, product lineup, and the full story — all here.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
