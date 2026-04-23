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
    links: [
      { rel: "canonical", href: "https://savorsunrise.com/contact" },
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
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

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
    // Validate required fields in React state since the form uses noValidate to
    // suppress native browser bubbles in favor of brand-aligned inline errors.
    const next: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) next.name = "Name needed.";
    if (!email.trim()) next.email = "Email needed.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Email looks off.";
    if (!message.trim()) next.message = "Message needed.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

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
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        {/* Giant color-flood page title. Tier-60 deep purple — quieter   */}
        {/* register for the sign-off/reach-us page; completes the tier    */}
        {/* color cycle across the four subpage heroes.                    */}
        <section className="c-pagehero">
          <h1 className="c-pagehero-title">Contact</h1>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
        <section className="c-hero">
          <div className="container">
            <div className="c-hero-inner">
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

        {/* ── 03 · FORM ─────────────────────────────────────────────────── */}
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
                          setErrors({});
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
                          className={`c-input${errors.name ? " c-input-error" : ""}`}
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (errors.name) setErrors({ ...errors, name: undefined });
                          }}
                          required
                          autoComplete="name"
                          aria-invalid={errors.name ? true : undefined}
                        />
                        {errors.name && <span className="c-field-error">{errors.name}</span>}
                      </label>
                      <label className="c-field">
                        <span className="c-field-label">Email</span>
                        <input
                          type="email"
                          className={`c-input${errors.email ? " c-input-error" : ""}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                          }}
                          required
                          autoComplete="email"
                          aria-invalid={errors.email ? true : undefined}
                        />
                        {errors.email && <span className="c-field-error">{errors.email}</span>}
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
                          className={`c-textarea${errors.message ? " c-input-error" : ""}`}
                          rows={6}
                          value={message}
                          onChange={(e) => {
                            setMessage(e.target.value);
                            if (errors.message) setErrors({ ...errors, message: undefined });
                          }}
                          required
                          aria-invalid={errors.message ? true : undefined}
                        />
                        {errors.message && <span className="c-field-error">{errors.message}</span>}
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

        {/* ── 04 · DIRECT CHANNELS ──────────────────────────────────────── */}
        <section className="c-direct">
          <div className="container">
            <div className="c-direct-head">
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

        {/* ── 05 · FOLLOW ALONG (tier-10 flood) ─────────────────────────── */}
        {/* Matches the red-flood closer pattern used on other subpages     */}
        {/* (About .a-ptp, Find .f-fallback, Home .s08-near-you). Three     */}
        {/* social tiles: Instagram / TikTok / LinkedIn. Placeholder        */}
        {/* handles with "#" hrefs — swap to real URLs when accounts live.  */}
        <section className="c-social">
          <div className="container">
            <div className="c-social-head">
              <h2 className="c-social-headline">Follow along.</h2>
            </div>
            <div className="c-social-grid">
              <a href="#" className="c-social-card" aria-label="SUNRISE on Instagram">
                <svg
                  className="c-social-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
                </svg>
                <div className="c-social-label">Instagram</div>
                <div className="c-social-handle">@savorsunrise</div>
                <div className="c-social-note">
                  Product drops, flavor launches, and behind-the-scenes from Tulsa.
                </div>
              </a>

              <a href="#" className="c-social-card" aria-label="SUNRISE on TikTok">
                <svg
                  className="c-social-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.5 3.5c.3 2.2 1.6 4 3.5 4.8v3.1c-1.5-.1-2.9-.6-4.1-1.5v6.8c0 3.5-2.9 6.3-6.4 6.3-3.5 0-6.3-2.8-6.3-6.3s2.8-6.3 6.3-6.3c.3 0 .6 0 .9.1v3.2c-.3-.1-.6-.1-.9-.1-1.8 0-3.2 1.4-3.2 3.1s1.4 3.2 3.2 3.2 3.2-1.4 3.2-3.2V3.5h3.8z" />
                </svg>
                <div className="c-social-label">TikTok</div>
                <div className="c-social-handle">@savorsunrise</div>
                <div className="c-social-note">
                  Taste tests, tasting-room moments, and the occasional recipe.
                </div>
              </a>

              <a href="#" className="c-social-card" aria-label="SUNRISE on LinkedIn">
                <svg
                  className="c-social-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.5 3.5C4.5 4.6 3.6 5.5 2.5 5.5S.5 4.6.5 3.5 1.4 1.5 2.5 1.5 4.5 2.4 4.5 3.5zM.8 7.5h3.4v15.5H.8V7.5zm6.4 0h3.2v2.1h.1c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.8V23h-3.4v-7.8c0-1.9 0-4.3-2.6-4.3s-3 2-3 4.2V23H7.2V7.5z" />
                </svg>
                <div className="c-social-label">LinkedIn</div>
                <div className="c-social-handle">SUNRISE Beverage</div>
                <div className="c-social-note">
                  Company updates, wholesale news, and what we're building.
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
