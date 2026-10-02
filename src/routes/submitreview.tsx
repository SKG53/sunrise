// Review submission page — /submitreview (noindex; reached from the Review
// Request emails, ?v=rr1|rr2|rr3).
//
// Submits to POST /api/public/review, which records the review in HubSpot
// (contact + one ticket in the Product Reviews pipeline) and logs a Klaviyo
// "Review Submitted" event. The success state — and the reward code — show
// ONLY after the server confirms the review was recorded (HTTP 200).
//
// Form order: stars → first name* / last name → email* → flavors (optional
// multi-select; each chosen flavor gets its own optional short review) →
// headline → message* → submit → publish disclaimer. The reward is the same
// for every rating; publish consent is given by submitting (disclaimer beneath
// the button). Public display name: first name + last initial.
//
// Flavors list only the SKUs in src/lib/liveProducts.ts (via reviewFlavors).
// ?product=<slug>[,<slug>…] pre-selects flavors (site slugs, e.g.
// ?product=60mg-blackberry-cbn). ?order= is optional and passed through.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import {
  REVIEW_TIERS,
  REVIEW_FLAVOR_LABELS,
  REVIEW_FLAVOR_ORDER,
  toSlug,
  optionLabel,
} from "../lib/reviewFlavors";
import "./contact.css";
import "./review.css";

export const Route = createFileRoute("/submitreview")({
  component: ReviewPage,
  head: () => ({
    meta: [
      { title: "Leave a Review · SUNRISE" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Tell us how your SUNRISE tasted. Every review earns 15% off your next order.",
      },
    ],
  }),
});

// ── CONFIG ───────────────────────────────────────────────────────────────
const REWARD_CODE = "15OFFREVIEW";
const REWARD_TERMS = "15% off any pack of 20 cans or fewer. One use per customer.";
const ERROR_MESSAGE = "Something went wrong — please try again, or email hello@savorsunrise.com.";
const BODY_MIN = 20;
const BODY_MAX = 1000;
const HEADLINE_MAX = 80;
const FLAVOR_NOTE_MAX = 500;
const LAST_NAME_MAX = 40;
const VARIANTS = new Set(["rr1", "rr2", "rr3"]);

const VALID_SLUGS = new Set(REVIEW_FLAVOR_ORDER);
const FLAVOR_LABELS = REVIEW_FLAVOR_LABELS;
const FLAVOR_ORDER = REVIEW_FLAVOR_ORDER;

const RATING_WORDS = ["", "Not for me", "It's okay", "Good", "Great", "Love it"];

// ── TYPES ────────────────────────────────────────────────────────────────
type Errors = Partial<Record<"rating" | "firstName" | "email" | "body", string>>;

type ReviewPayload = {
  rating: number;
  firstName: string;
  lastName: string; // optional; shown publicly as its initial only
  email: string;
  flavors: { slug: string; review: string }[]; // empty = general review
  headline: string;
  body: string;
  consentToPublish: true; // given by submitting (disclaimer beneath button)
  sourcePage: string;
  submittedAt: string;
  variant: string; // "rr1" | "rr2" | "rr3" | ""
  order: string; // optional order reference, "" if none
  company: string; // honeypot — always "" for real visitors
};

// ── SUBMIT ───────────────────────────────────────────────────────────────
// Resolves only on HTTP 200; anything else throws so the form shows the error
// and the reward code is never revealed for an unrecorded review.
async function submitReview(payload: ReviewPayload): Promise<void> {
  const res = await fetch("/api/public/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
}

// ── FLAVOR MULTI-SELECT ──────────────────────────────────────────────────
// Dropdown trigger styled like the form's selects; opens a tier-grouped
// checkbox panel. Closes on outside click or Escape.
function FlavorMultiSelect({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const summary =
    selected.length === 0
      ? "Choose flavors"
      : selected.length === 1
        ? FLAVOR_LABELS.get(selected[0]) ?? "1 flavor selected"
        : `${selected.length} flavors selected`;

  return (
    <div className="rv-ms" ref={rootRef}>
      <button
        type="button"
        className={`c-select rv-ms-trigger${selected.length ? "" : " rv-ms-empty"}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {summary}
      </button>
      {open && (
        <div className="rv-ms-panel" role="group" aria-label="Flavors">
          {REVIEW_TIERS.map(({ tier, label, flavors }) => (
            <div key={tier} className="rv-ms-group">
              <div className="rv-ms-group-label">{label}</div>
              {flavors.map((f) => {
                const slug = toSlug(tier, f);
                return (
                  <label key={slug} className="rv-ms-option">
                    <input
                      type="checkbox"
                      checked={selected.includes(slug)}
                      onChange={() => onToggle(slug)}
                    />
                    <span>{optionLabel(tier, f)}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── COMPONENT ────────────────────────────────────────────────────────────
function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [flavors, setFlavors] = useState<string[]>([]);
  const [flavorNotes, setFlavorNotes] = useState<Record<string, string>>({});
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [company, setCompany] = useState(""); // honeypot

  // The Spin & Save popup is kept off this page by the path check in
  // components/SpinWheel.tsx (eligible() and reveal()).

  // Read URL params on load (browser-only): ?product= pre-selects flavors,
  // ?v= tags which Review Request email drove the visit, ?order= passes through.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const raw = q.get("product");
    if (raw) {
      const picks = raw.split(",").map((x) => x.trim()).filter((x) => VALID_SLUGS.has(x));
      if (picks.length) setFlavors(FLAVOR_ORDER.filter((s) => picks.includes(s)));
    }
    const v = (q.get("v") || "").trim().toLowerCase();
    if (VARIANTS.has(v)) setVariant(v);
    const o = (q.get("order") || "").trim();
    if (o && o.length <= 30 && /^[#0-9]+$/.test(o)) setOrderRef(o);
  }, []);

  const clear = (key: keyof Errors) => {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // Keep selections in display order so the per-flavor boxes don't jump.
  const toggleFlavor = (slug: string) =>
    setFlavors((cur) =>
      cur.includes(slug)
        ? cur.filter((s) => s !== slug)
        : FLAVOR_ORDER.filter((s) => s === slug || cur.includes(s)),
    );

  const validate = (): Errors => {
    const next: Errors = {};
    if (rating < 1) next.rating = "Pick a star rating.";
    if (!firstName.trim()) next.firstName = "First name needed.";
    if (!email.trim()) next.email = "Email needed.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Email looks off.";
    if (body.trim().length < BODY_MIN) next.body = `A few more words, please (at least ${BODY_MIN} characters).`;
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitReview({
        rating,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        flavors: flavors.map((slug) => ({ slug, review: (flavorNotes[slug] ?? "").trim() })),
        headline: headline.trim(),
        body: body.trim(),
        consentToPublish: true,
        sourcePage: typeof window !== "undefined" ? window.location.pathname : "/submitreview",
        submittedAt: new Date().toISOString(),
        variant,
        order: orderRef,
        company,
      });
      setSubmitted(true);
      // Bring the success card (and the code) into view — on phones the card
      // sits below the side copy, so scrolling to page top would hide the code.
      // Offset by the sticky announcement bar + header so they don't cover it.
      requestAnimationFrame(() => {
        const card = cardRef.current;
        if (!card) return;
        const sticky = [".announcement-bar", ".site-header"].reduce(
          (sum, sel) => sum + ((document.querySelector(sel) as HTMLElement | null)?.offsetHeight ?? 0),
          0,
        );
        const top = card.getBoundingClientRect().top + window.scrollY - sticky - 16;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    } catch {
      setSubmitError(ERROR_MESSAGE);
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(REWARD_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  // Name and email carry over; everything about the review itself resets.
  const resetForAnother = () => {
    setSubmitted(false);
    setRating(0);
    setFlavors([]);
    setFlavorNotes({});
    setHeadline("");
    setBody("");
    setErrors({});
    setCopied(false);
  };

  const shownRating = hoverRating || rating;

  return (
    <>
      <SiteHeader />

      <main className="rv-page">
        {/* ── 01 · PAGE HERO ────────────────────────────────────────────── */}
        <section className="c-pagehero rv-pagehero">
          <p className="c-pagehero-title" aria-label="Reviews">
            {"Reviews".split("").map((ch, i) => (
              <span key={i} aria-hidden="true">{ch}</span>
            ))}
          </p>
        </section>

        {/* ── 02 · FORM ─────────────────────────────────────────────────── */}
        <section className="c-form-section">
          <div className="container">
            <div className="c-form-grid">
              <div className="c-form-side">
                <div className="c-eyebrow">Share Your Sunrise</div>
                <h1 className="c-form-headline">
                  How was your <span className="accent rv-accent">sip?</span>
                </h1>
                <p className="c-form-sub">
                  Tell us about the taste, the feel, and the moments you reach for it.
                  Leave us an honest review and automatically earn{" "}
                  <strong>15% off</strong> your next order.
                </p>
              </div>

              <div className="c-form-card rv-card" ref={cardRef}>
                {submitted ? (
                  <div className="c-success" role="status" aria-live="polite">
                    <div className="c-success-eyebrow">Review Received</div>
                    <div className="c-success-headline">Thanks for the feedback</div>
                    <p className="c-success-body">
                      Here's 15% off your next order, our thanks for sharing.
                    </p>

                    {/* Mirrors the Spin & Save code box (dashed gold, copy icon). */}
                    <button type="button" className="rv-code" onClick={copyCode} title="Copy code">
                      <span className="rv-code-text">{REWARD_CODE}</span>
                      <span className="rv-code-copy">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="rv-copy-icon">
                          <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                          <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {copied ? "Copied!" : "Copy"}
                      </span>
                    </button>
                    <div className="rv-fine">{REWARD_TERMS}</div>

                    <div className="c-success-ctas">
                      <a href="/products" className="btn btn-primary">
                        Shop the Lineup
                      </a>
                      <button type="button" className="btn btn-secondary" onClick={resetForAnother}>
                        Add Another Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="c-form" onSubmit={handleSubmit} noValidate>
                    {/* Honeypot — invisible to people; bots that fill it are dropped server-side. */}
                    <div className="rv-hp" aria-hidden="true">
                      <label>
                        Company
                        <input
                          type="text"
                          name="company"
                          tabIndex={-1}
                          autoComplete="off"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </label>
                    </div>
                    {/* Rating */}
                    <fieldset className="rv-rating-field">
                      <legend className="c-field-label">Your Rating</legend>
                      <div
                        className="rv-stars"
                        role="radiogroup"
                        aria-label="Star rating"
                        onMouseLeave={() => setHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label
                            key={n}
                            className={`rv-star${n <= shownRating ? " rv-star-on" : ""}`}
                            onMouseEnter={() => setHoverRating(n)}
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={n}
                              checked={rating === n}
                              onChange={() => {
                                setRating(n);
                                clear("rating");
                              }}
                              className="rv-star-input"
                              aria-label={`${n} star${n > 1 ? "s" : ""} — ${RATING_WORDS[n]}`}
                            />
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="rv-star-icon">
                              <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z" />
                            </svg>
                          </label>
                        ))}
                        <span className="rv-rating-word" aria-live="polite">
                          {shownRating ? RATING_WORDS[shownRating] : "Tap to rate"}
                        </span>
                      </div>
                      {errors.rating && <span className="c-field-error">{errors.rating}</span>}
                    </fieldset>

                    {/* Name */}
                    <div className="c-form-row c-form-row-split">
                      <label className="c-field">
                        <span className="c-field-label">First Name</span>
                        <input
                          type="text"
                          className={`c-input${errors.firstName ? " c-input-error" : ""}`}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            clear("firstName");
                          }}
                          autoComplete="given-name"
                          aria-invalid={errors.firstName ? true : undefined}
                        />
                        {errors.firstName && <span className="c-field-error">{errors.firstName}</span>}
                      </label>
                      <label className="c-field">
                        <span className="c-field-label">
                          Last Name <span className="rv-optional">(optional)</span>
                        </span>
                        <input
                          type="text"
                          className="c-input"
                          value={lastName}
                          maxLength={LAST_NAME_MAX}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                        />
                      </label>
                    </div>

                    {/* Email */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Email</span>
                        <input
                          type="email"
                          className={`c-input${errors.email ? " c-input-error" : ""}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            clear("email");
                          }}
                          autoComplete="email"
                          aria-invalid={errors.email ? true : undefined}
                        />
                        {errors.email && <span className="c-field-error">{errors.email}</span>}
                      </label>
                    </div>

                    {/* Flavors (optional multi-select) + one short review per flavor */}
                    <div className="c-form-row">
                      <div className="c-field">
                        <span className="c-field-label">
                          Flavor <span className="rv-optional">(optional)</span>
                        </span>
                        <FlavorMultiSelect selected={flavors} onToggle={toggleFlavor} />
                      </div>
                    </div>
                    {flavors.map((slug) => (
                      <div key={slug} className="c-form-row rv-flavor-note">
                        <label className="c-field">
                          <span className="c-field-label">
                            {FLAVOR_LABELS.get(slug)} <span className="rv-optional">(optional)</span>
                          </span>
                          <textarea
                            className="c-textarea rv-flavor-textarea"
                            value={flavorNotes[slug] ?? ""}
                            maxLength={FLAVOR_NOTE_MAX}
                            rows={2}
                            placeholder="A quick take on this flavor"
                            onChange={(e) =>
                              setFlavorNotes((n) => ({ ...n, [slug]: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    ))}

                    {/* Headline */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">
                          Headline <span className="rv-optional">(optional)</span>
                        </span>
                        <input
                          type="text"
                          className="c-input"
                          value={headline}
                          maxLength={HEADLINE_MAX}
                          placeholder="Sum it up in a few words"
                          onChange={(e) => setHeadline(e.target.value)}
                        />
                      </label>
                    </div>

                    {/* Message */}
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Message</span>
                        <textarea
                          className={`c-textarea${errors.body ? " c-input-error" : ""}`}
                          value={body}
                          maxLength={BODY_MAX}
                          placeholder="How did it taste? How did it feel? When do you enjoy it?"
                          onChange={(e) => {
                            setBody(e.target.value);
                            clear("body");
                          }}
                          aria-invalid={errors.body ? true : undefined}
                        />
                        {errors.body && <span className="c-field-error">{errors.body}</span>}
                      </label>
                    </div>

                    <div className="c-form-submit">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Sending…" : "Submit Review"}
                      </button>
                      {submitError && (
                        <span className="c-field-error" role="alert" style={{ display: "block", marginTop: "0.5rem" }}>
                          {submitError}
                        </span>
                      )}
                    </div>

                    <div className="c-form-note rv-disclosure">
                      By submitting, you agree that SUNRISE may publish your review, rating,
                      and first name with last initial on its website and in its marketing.
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
