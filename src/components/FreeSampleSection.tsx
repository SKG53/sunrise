// FREE SAMPLES section ("Want a Taste?") — reusable across pages (home
// first). Promotes the WEBFREECAN offer (the web-only twin of the email
// FREECAN code, so web redemptions can be told apart): one free single can of
// any flavor/strength per order, the customer just covers shipping. Layout
// mirrors home S03 (Infused Seltzers / Simple Ingredients): 2-line headline
// with an accent second line, a short subhead + code box,
// then four PD-style product cards linking to their PD pages.
//
// The code box mirrors the Spin & Save reveal code graphic (.spin-code in
// SpinWheel.css): white field, 2px dashed gold border, code left, copy icon +
// "Copy" label right, click-to-copy. Styles are duplicated under the .fs-*
// namespace (FreeSampleSection.css) so this section never depends on the
// spin wheel's stylesheet or the home page's stylesheet being loaded.
//
// EMAIL GATE (brief v2, 2026-10-05): the code is hidden behind a one-field
// email form (same pattern as the Spin & Save reveal). Submit awaits the
// Supabase gate (/api/public/newsletter, source "free-can"), then fires the
// HubSpot + Klaviyo writes without awaiting (Klaviyo logs "Claimed Free Can",
// the Free Can flow trigger — never Newsletter Signup or Claimed Deal).
//   - Klaviyo email visitors (isEmailVisitor) see FREECAN already revealed;
//     nothing is written.
//   - A reveal is remembered for the visit (sessionStorage) so the visitor
//     isn't asked again on another page.
//   - Honeypot filled -> client-side reveal, no API calls.
//   - Every revealed state shows a "Claim Your Can" link (CLAIM_HREF).
// State is resolved in useEffect (the server always renders the gated form)
// and the gate/code area has a fixed min-height so swaps never move the cards.
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  getBasePx,
} from "../lib/sunrise-components";
import { readUtms, isEmailVisitor } from "../lib/utms";
import "./FreeSampleSection.css";

const DEFAULT_CODE = "WEBFREECAN"; // organic web code (gated)
const EMAIL_CODE = "FREECAN"; // Klaviyo email visitors (ungated)
const REVEALED_KEY = "sunrise:freecan-revealed"; // value = the revealed code
const SPIN_SEEN_KEY = "sunrise:spin-wheel-seen"; // suppresses Spin & Save
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Claim Your Can" button target per revealed code. Switch to the landing
// pages when they ship (/webfreecan, /freecan); nothing else here changes.
const CLAIM_HREF: Record<string, string> = {
  WEBFREECAN: "/products",
  FREECAN: "/products",
};

const SUBHEAD_GATED =
  "Enter your email to unlock your code. Add a single can of any flavor or strength to your cart, then use the code at checkout. You just cover shipping. Limit one per order. Cannot be combined with other offers.";
const SUBHEAD_REVEALED =
  "Add a single can of any flavor or strength to your cart, then enter this code at checkout to make it free (you just cover shipping). Limit one per order. Cannot be combined with other offers.";

type FreeSampleSectionProps = {
  code?: string; // default "WEBFREECAN"
  source?: "organic" | "meta"; // default "organic"; goes into the event
};

// Fireworks burst on a fresh reveal — copied from SpinWheel.tsx's
// Fireworks() under the .fs-* namespace (no import from SpinWheel).
function Fireworks() {
  const bursts = [
    { top: "34%", left: "22%", color: "var(--tier-5)", delay: "0s" },
    { top: "28%", left: "72%", color: "var(--tier-10)", delay: "0.12s" },
    { top: "60%", left: "54%", color: "var(--tier-30)", delay: "0.26s" },
    { top: "44%", left: "44%", color: "var(--tier-60)", delay: "0.08s" },
  ];
  return (
    <div className="fs-fireworks" aria-hidden="true">
      {bursts.map((b, i) => (
        <span
          key={i}
          className="fs-burst"
          style={{ top: b.top, left: b.left, color: b.color, animationDelay: b.delay }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <span
              key={j}
              className="fs-particle"
              style={{ "--rotate": `${j * 30}deg` } as CSSProperties}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

type FsCard = {
  slug: string;
  flavor: string;
  descriptor: string;
  color: string;
  tier: 10 | 30 | 60;
  cannabinoid?: "CBG" | "CBN" | "THCV";
  // Explicit name lines when the flavor is 3+ words; the name block reserves
  // exactly two lines so all four cards keep their descriptor/CTA rows aligned.
  nameLines?: string[];
};

// Flavor, descriptor, and color match the PD data in products_.$slug.tsx.
const FS_CARDS: FsCard[] = [
  { slug: "10mg-strawberry", flavor: "Strawberry", descriptor: "Fresh + Fruity", color: "#CC1F39", tier: 10 },
  { slug: "30mg-orange-lemonade", flavor: "Orange Lemonade", descriptor: "Bright + Tart", color: "#FAA819", tier: 30 },
  { slug: "60mg-wild-cherry-peach", flavor: "Wild Cherry Peach", descriptor: "Lush + Juicy", color: "#861625", tier: 60, nameLines: ["Wild Cherry", "Peach"] },
  { slug: "60mg-blackberry-cbn", flavor: "Blackberry", descriptor: "Dark + Smooth", color: "#2E1E3D", tier: 60, cannabinoid: "CBN" },
];

export function FreeSampleSection({ code = DEFAULT_CODE, source = "organic" }: FreeSampleSectionProps = {}) {
  const lockupRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const cannabinoidRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [copied, setCopied] = useState(false);
  // Gate state. The server always renders "gated" with the prop code; the
  // email-visitor and remembered-reveal cases are resolved on mount.
  const [revealed, setRevealed] = useState(false);
  const [shownCode, setShownCode] = useState(code);
  const [fresh, setFresh] = useState(false); // fireworks: fresh reveal only
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Email visitors (strict URL/session signal only) take precedence.
    if (isEmailVisitor()) {
      setShownCode(EMAIL_CODE);
      setRevealed(true);
      return;
    }
    try {
      if (sessionStorage.getItem(REVEALED_KEY) === code) {
        setShownCode(code);
        setRevealed(true);
      }
    } catch {
      /* private mode — stay gated */
    }
  }, [code]);

  const reveal = () => {
    try {
      sessionStorage.setItem(REVEALED_KEY, code);
    } catch {
      /* private mode */
    }
    // The visitor just gave an email: no second ask from Spin & Save this visit.
    try {
      sessionStorage.setItem(SPIN_SEEN_KEY, "true");
    } catch {
      /* private mode */
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShownCode(code);
    setFresh(!reduced);
    setRevealed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    // Honeypot: real visitors never fill it. Reveal client-side, write nothing.
    if (company.trim()) {
      reveal();
      return;
    }
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // The Supabase write is the only gate; duplicates return success.
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "free-can" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      // Not awaited: neither write may delay or fail the reveal.
      fetch("/api/public/free-can-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, ...readUtms() }),
      }).catch(() => {});
      fetch("/api/public/free-can-klaviyo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          ...readUtms(),
          code,
          source,
          page:
            typeof location !== "undefined"
              ? `${location.host.replace(/^www\./, "")}${location.pathname}`
              : undefined,
        }),
      }).catch(() => {});
      reveal();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Paint the cream potency lockups (+ cannabinoid strip) — same sizes as the
  // home S03 cards: 28 mobile / 44 desktop, cannabinoid at base × 0.91.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const lockupBase = window.innerWidth <= 520 ? 28 : 44;
      FS_CARDS.forEach((card, i) => {
        const lockupEl = lockupRefs.current[i];
        if (lockupEl) {
          lockupEl.innerHTML =
            card.tier === 10 ? render10mgLockup(lockupBase, "#FEFBE0") :
            card.tier === 30 ? render30mgLockup(lockupBase, "#FEFBE0") :
                               render60mgLockup(lockupBase, "#FEFBE0");
        }
        const cbEl = cannabinoidRefs.current[i];
        if (cbEl && card.cannabinoid) {
          const cbSize = base * 0.91;
          cbEl.innerHTML =
            card.cannabinoid === "CBG" ? renderCBGLockup(cbSize, "#FEFBE0") :
            card.cannabinoid === "CBN" ? renderCBNLockup(cbSize, "#FEFBE0") :
                                         renderTHCVLockup(cbSize, "#FEFBE0");
        }
      });
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(shownCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  return (
    <section className="fs-free-samples">
      <div className="container">
        <h2 className="fs-headline">
          Want a Taste?<br />
          <span className="accent">Just Cover Shipping</span>
        </h2>
        {/* Both subheads share one grid cell; the inactive one is hidden but
            still sizes the cell, so swapping copy never changes the height. */}
        <div className="fs-subhead-stack">
          <p className={`fs-subhead${revealed ? " is-hidden" : ""}`} aria-hidden={revealed}>
            {SUBHEAD_GATED}
          </p>
          <p className={`fs-subhead${revealed ? "" : " is-hidden"}`} aria-hidden={!revealed}>
            {SUBHEAD_REVEALED}
          </p>
        </div>
        <div className={`fs-gate${revealed ? " is-revealed" : ""}`} aria-live="polite">
          {revealed ? (
            <div className="fs-revealed">
              <div className="fs-code-wrap">
                {fresh && <Fireworks />}
                <button type="button" className="fs-code" onClick={copyCode} title="Copy code">
                  <span className="fs-code-text">{shownCode}</span>
                  <span className="fs-code-copy">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="fs-copy-icon">
                      <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
              </div>
              {/* Plain same-tab link; fires no events. Target via CLAIM_HREF. */}
              <a href={CLAIM_HREF[shownCode] ?? "/products"} className="fs-btn fs-claim">
                Claim Your Can
              </a>
            </div>
          ) : (
            <form className="fs-form" onSubmit={handleSubmit} noValidate>
              {/* Honeypot — invisible to people; if filled, nothing is written. */}
              <div className="fs-hp" aria-hidden="true">
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
              <input
                type="email"
                className="fs-input"
                placeholder="Email address"
                aria-label="Email address"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
              {error && (
                <p className="fs-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="fs-btn" disabled={submitting}>
                {submitting ? "Unlocking\u2026" : "Unlock My Code"}
              </button>
              <p className="fs-fine">
                By entering your email, you agree to receive marketing emails from
                SUNRISE. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
        <div className="fs-card-grid">
          {FS_CARDS.map((card, i) => (
            <div
              key={card.slug}
              className="fs-card"
              style={{ ["--card-flavor-color" as string]: card.color } as React.CSSProperties}
            >
              <Link to="/products/$slug" params={{ slug: card.slug }} className="fs-card-link">
                <div className="fs-card-can" style={{ background: card.color }}>
                  <img
                    src={`/images/cans/${card.slug}.webp`}
                    alt={`SUNRISE ${card.flavor} ${card.tier}mg hemp-infused THC${card.cannabinoid ? ` + ${card.cannabinoid}` : ""} seltzer can`}
                    width="960"
                    height="1920"
                    loading="lazy"
                  />
                  <span
                    className="fs-card-tier"
                    ref={(el) => { lockupRefs.current[i] = el; }}
                    aria-label={`${card.tier} milligram THC`}
                  />
                  {card.cannabinoid && (
                    <span
                      className="fs-card-cannabinoid"
                      ref={(el) => { cannabinoidRefs.current[i] = el; }}
                      aria-label={`+${card.cannabinoid}`}
                    />
                  )}
                </div>
                <div className="fs-card-meta">
                  <div className="fs-card-name">
                    {(card.nameLines ?? card.flavor.split(" ")).map((word, wi, arr) => (
                      <span key={wi} className="fs-card-name-line">
                        {word}
                        {wi < arr.length - 1 ? <br /> : null}
                      </span>
                    ))}
                  </div>
                  <div className="fs-card-descriptor">{card.descriptor}</div>
                </div>
              </Link>
              <div className="fs-card-cta">
                <Link
                  to="/products/$slug"
                  params={{ slug: card.slug }}
                  className="btn btn-flavor"
                  style={{ ["--flavor-color" as string]: card.color } as React.CSSProperties}
                >
                  Try It Free
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
