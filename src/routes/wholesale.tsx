// Wholesale intake page — the page itself is the CTA (no PtP band). The form is
// a direct wholesale inquiry: identity + business + one business address + note.
// Dual-write on submit: /api/public/contact (confirmation + hello@ notification
// emails, business + address folded into the message body) and the non-blocking
// /api/public/wholesale-hubspot (structured contact: contact_type = Wholesale
// Retail Customer, company, address fields, web_signup_source = Wholesale
// Contact Form). The reward/email path is the gate; HubSpot never blocks it.

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { readUtms } from "../lib/utms";
import "./wholesale.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── COMPONENT ────────────────────────────────────────────────────────────
function WholesalePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearErr = (k: string) =>
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const n = { ...prev };
      delete n[k];
      return n;
    });

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setBusinessName("");
    setLine1("");
    setLine2("");
    setCity("");
    setStateField("");
    setZip("");
    setMessage("");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields in React state since the form uses noValidate to
    // suppress native browser bubbles in favor of brand-aligned inline errors.
    // Required: first/last name, email, business name, city, state, zip,
    // message. Address Line 1 and Line 2 are optional.
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "First name needed.";
    if (!lastName.trim()) next.lastName = "Last name needed.";
    if (!email.trim()) next.email = "Email needed.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Email looks off.";
    if (!businessName.trim()) next.businessName = "Business name needed.";
    if (!city.trim()) next.city = "City needed.";
    if (!stateField.trim()) next.state = "State needed.";
    if (!zip.trim()) next.zip = "Zip needed.";
    else if (!/^\d{5}$/.test(zip.trim())) next.zip = "Enter a 5-digit ZIP.";
    if (!message.trim()) next.message = "Message needed.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Fold the street lines + city/state/zip into one readable address string.
    const street = [line1.trim(), line2.trim()].filter(Boolean).join(", ");
    const cityStateZip = `${city.trim()}, ${stateField.trim()} ${zip.trim()}`.trim();
    const fullAddress = [street, cityStateZip].filter(Boolean).join(", ");

    // Compose the email body so the hello@ notification + the submitter's
    // confirmation show business + address (those templates render only
    // name/email/reason/message, so the detail rides inside message).
    const composedMessage =
      `Business Name: ${businessName.trim()}\n` +
      `Business Address: ${fullAddress}\n\n` +
      message.trim();

    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          reason: "Wholesale / Retail Partnership",
          message: composedMessage,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      // Non-blocking structured dual-write to HubSpot — fired in parallel and
      // deliberately NOT awaited: the success message and the two emails (owned
      // by /api/public/contact above) must never wait on, or fail because of,
      // HubSpot. A rejected fetch is swallowed so it can't surface to the user.
      fetch("/api/public/wholesale-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          businessName: businessName.trim(),
          address: street,
          city: city.trim(),
          state: stateField.trim(),
          zip: zip.trim(),
          message: message.trim(),
          ...readUtms(),
        }),
      }).catch(() => {});
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please email hello@savorsunrise.com."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader activeNav="wholesale" />

      <main>
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="w-pagehero">
          <p className="w-pagehero-title" aria-label="Wholesale">
            {"Wholesale".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === " " ? "\u00A0" : ch}</span>
            ))}
          </p>
        </section>

        {/* ── 02 · HERO ─────────────────────────────────────────────────── */}
        <section className="w-hero">
          <div className="container">
            <div className="w-hero-inner">
              <h1 className="w-hero-headline">
                Put SUNRISE on<br />
                your <em className="accent-italic">shelves</em>
              </h1>
              <p className="w-hero-body">
                Interested in carrying SUNRISE? Share your business details
                below and our team will follow up with wholesale pricing,
                availability, and next steps.
              </p>
            </div>
          </div>
        </section>

        {/* ── 03 · FORM ─────────────────────────────────────────────────── */}
        <section className="w-form-section">
          <div className="container">
            <div className="w-form-grid">
              <div className="w-form-side">
                <div className="w-eyebrow">Wholesale Inquiry</div>
                <h2 className="w-form-headline">
                  Let's talk <span className="accent">wholesale</span>
                </h2>
                <p className="w-form-sub">
                  Tell us about your business and we'll be in touch within two
                  business days. Please don't include sensitive personal or
                  health information.
                </p>
              </div>

              <div className="w-form-card">
                {submitted ? (
                  <div className="w-success" role="status" aria-live="polite">
                    <div className="w-success-eyebrow">Inquiry Sent</div>
                    <div className="w-success-headline">Thanks for reaching out</div>
                    <p className="w-success-body">
                      We've got your wholesale inquiry and our team will follow
                      up within two business days. In the meantime, explore the
                      lineup.
                    </p>
                    <div className="w-success-ctas">
                      <a href="/products" className="btn btn-primary">
                        See the Lineup
                      </a>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setSubmitted(false);
                          reset();
                        }}
                      >
                        Send Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="w-form" onSubmit={handleSubmit} noValidate>
                    <div className="w-form-row w-form-row-split">
                      <label className="w-field">
                        <span className="w-field-label">First Name</span>
                        <input
                          type="text"
                          className={`w-input${errors.firstName ? " w-input-error" : ""}`}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            clearErr("firstName");
                          }}
                          required
                          autoComplete="given-name"
                          aria-invalid={errors.firstName ? true : undefined}
                        />
                        {errors.firstName && <span className="w-field-error">{errors.firstName}</span>}
                      </label>
                      <label className="w-field">
                        <span className="w-field-label">Last Name</span>
                        <input
                          type="text"
                          className={`w-input${errors.lastName ? " w-input-error" : ""}`}
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            clearErr("lastName");
                          }}
                          required
                          autoComplete="family-name"
                          aria-invalid={errors.lastName ? true : undefined}
                        />
                        {errors.lastName && <span className="w-field-error">{errors.lastName}</span>}
                      </label>
                    </div>

                    <div className="w-form-row w-form-row-split">
                      <label className="w-field">
                        <span className="w-field-label">Email</span>
                        <input
                          type="email"
                          className={`w-input${errors.email ? " w-input-error" : ""}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clearErr("email");
                          }}
                          required
                          autoComplete="email"
                          aria-invalid={errors.email ? true : undefined}
                        />
                        {errors.email && <span className="w-field-error">{errors.email}</span>}
                      </label>
                      <label className="w-field">
                        <span className="w-field-label">Business Name</span>
                        <input
                          type="text"
                          className={`w-input${errors.businessName ? " w-input-error" : ""}`}
                          value={businessName}
                          onChange={(e) => {
                            setBusinessName(e.target.value);
                            clearErr("businessName");
                          }}
                          required
                          autoComplete="organization"
                          aria-invalid={errors.businessName ? true : undefined}
                        />
                        {errors.businessName && <span className="w-field-error">{errors.businessName}</span>}
                      </label>
                    </div>

                    <div className="w-form-row">
                      <label className="w-field">
                        <span className="w-field-label">Address Line 1 (Optional)</span>
                        <input
                          type="text"
                          className="w-input"
                          value={line1}
                          onChange={(e) => setLine1(e.target.value)}
                          autoComplete="address-line1"
                        />
                      </label>
                    </div>

                    <div className="w-form-row">
                      <label className="w-field">
                        <span className="w-field-label">Address Line 2 (Optional)</span>
                        <input
                          type="text"
                          className="w-input"
                          value={line2}
                          onChange={(e) => setLine2(e.target.value)}
                          autoComplete="address-line2"
                        />
                      </label>
                    </div>

                    <div className="w-form-row w-form-row-triple">
                      <label className="w-field">
                        <span className="w-field-label">City</span>
                        <input
                          type="text"
                          className={`w-input${errors.city ? " w-input-error" : ""}`}
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            clearErr("city");
                          }}
                          required
                          autoComplete="address-level2"
                          aria-invalid={errors.city ? true : undefined}
                        />
                        {errors.city && <span className="w-field-error">{errors.city}</span>}
                      </label>
                      <label className="w-field">
                        <span className="w-field-label">State</span>
                        <input
                          type="text"
                          className={`w-input${errors.state ? " w-input-error" : ""}`}
                          value={stateField}
                          onChange={(e) => {
                            setStateField(e.target.value);
                            clearErr("state");
                          }}
                          required
                          autoComplete="address-level1"
                          aria-invalid={errors.state ? true : undefined}
                        />
                        {errors.state && <span className="w-field-error">{errors.state}</span>}
                      </label>
                      <label className="w-field">
                        <span className="w-field-label">Zip</span>
                        <input
                          type="text"
                          className={`w-input${errors.zip ? " w-input-error" : ""}`}
                          value={zip}
                          onChange={(e) => {
                            setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
                            clearErr("zip");
                          }}
                          required
                          autoComplete="postal-code"
                          inputMode="numeric"
                          maxLength={5}
                          aria-invalid={errors.zip ? true : undefined}
                        />
                        {errors.zip && <span className="w-field-error">{errors.zip}</span>}
                      </label>
                    </div>

                    <div className="w-form-row">
                      <label className="w-field">
                        <span className="w-field-label">Message</span>
                        <textarea
                          className={`w-textarea${errors.message ? " w-input-error" : ""}`}
                          rows={6}
                          value={message}
                          onChange={(e) => {
                            setMessage(e.target.value);
                            clearErr("message");
                          }}
                          required
                          aria-invalid={errors.message ? true : undefined}
                        />
                        {errors.message && <span className="w-field-error">{errors.message}</span>}
                      </label>
                    </div>

                    <div className="w-form-submit">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? "Sending…" : "Send Message"}
                      </button>
                      <span className="w-form-note">
                        We'll never share your information.
                      </span>
                      {submitError && (
                        <span className="w-field-error" role="alert" style={{ display: "block", marginTop: "0.5rem" }}>
                          {submitError}
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 · DIRECT CHANNELS (email only) ──────────────────────────── */}
        <section className="w-direct">
          <div className="container">
            <div className="w-direct-grid">
              <div className="w-direct-head">
                <h2 className="w-direct-headline">
                  Contact us <span className="accent">directly</span>
                </h2>
              </div>

              <div className="w-direct-card">
                <div className="w-direct-label">Email</div>
                <div className="w-direct-value">
                  <a href="mailto:hello@savorsunrise.com">hello@savorsunrise.com</a>
                </div>
                <div className="w-direct-note">
                  Quickest way to reach us. Mention <strong>wholesale</strong> or{" "}
                  <strong>retail</strong> in the subject so we route it fast.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05 · FOLLOW ALONG (tier-10 flood) ─────────────────────────── */}
        <section className="w-social">
          <div className="container">
            <div className="w-social-head">
              <h2 className="w-social-headline">Follow along</h2>
            </div>
            <div className="w-social-grid">
              <div className="w-social-card">
                <svg
                  className="w-social-icon"
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
                <a
                  href="https://www.instagram.com/savorsunrise"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-social-handle"
                  aria-label="SUNRISE on Instagram"
                >
                  @savorsunrise
                </a>
              </div>

              <div className="w-social-card">
                <svg
                  className="w-social-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.5 3.5c.3 2.2 1.6 4 3.5 4.8v3.1c-1.5-.1-2.9-.6-4.1-1.5v6.8c0 3.5-2.9 6.3-6.4 6.3-3.5 0-6.3-2.8-6.3-6.3s2.8-6.3 6.3-6.3c.3 0 .6 0 .9.1v3.2c-.3-.1-.6-.1-.9-.1-1.8 0-3.2 1.4-3.2 3.1s1.4 3.2 3.2 3.2 3.2-1.4 3.2-3.2V3.5h3.8z" />
                </svg>
                <a
                  href="#"
                  className="w-social-handle"
                  aria-label="SUNRISE on TikTok"
                >
                  @savorsunrise
                </a>
              </div>

              <div className="w-social-card">
                <svg
                  className="w-social-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M4.5 3.5C4.5 4.6 3.6 5.5 2.5 5.5S.5 4.6.5 3.5 1.4 1.5 2.5 1.5 4.5 2.4 4.5 3.5zM.8 7.5h3.4v15.5H.8V7.5zm6.4 0h3.2v2.1h.1c.5-.9 1.7-1.9 3.6-1.9 3.8 0 4.5 2.5 4.5 5.8V23h-3.4v-7.8c0-1.9 0-4.3-2.6-4.3s-3 2-3 4.2V23H7.2V7.5z" />
                </svg>
                <a
                  aria-disabled="true"
                  className="w-social-handle"
                  aria-label="SUNRISE on LinkedIn"
                >
                  SUNRISE Beverage
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/wholesale")({
  component: WholesalePage,
  head: () => ({
    meta: [
      { title: "Wholesale · SUNRISE" },
      {
        name: "description",
        content:
          "Carry SUNRISE in your store. Request wholesale pricing and availability from the SUNRISE team.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://www.savorsunrise.com/wholesale" },
    ],
  }),
});
