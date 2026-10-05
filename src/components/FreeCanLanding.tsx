// FREE CAN landing page — shared by three routes that are copies of one
// another, differing only in the discount code (so redemptions show the
// channel):
//   /tryfreecan → TRYFREECAN (Meta ads)
//   /webfreecan → WEBFREECAN (website)
//   /freecan    → FREECAN    (email)
// Production build of the srbev.com/neverpull/tryfreecan prototype the founder
// approved Oct 5 2026 (layout/flow/behavior). Per the standing rule, every
// lander element was swapped for the main site's own: "10 MG THC" lockups +
// "+CBG/+CBN/+THCV" strips, real can renders (/images/cans), main SiteHeader +
// SiteFooter (full disclaimer), real writes, checkout email prefill.
//
// Layout: site header → "Want a Taste? / Just Cover Shipping" → strength-
// grouped grid (3-up desktop, 2-up phones). Tapping a card opens the "Your
// pick" claim panel directly beneath that card's row. Founder decisions: never
// show the shipping dollar amount ("you just cover the shipping fee"); the
// strength-group heading lockups are 2× the FreeSampleSection size; cards have
// no potency lockup (the can art shows the strength).
//
// Claim → same contract as FreeSampleSection's email gate: awaits the Supabase
// gate (/api/public/newsletter, source "free-can"), then fires free-can-hubspot
// (web_signup_source = Free Can, first-touch) and free-can-klaviyo (subscribe +
// "Claimed Free Can" event: code, source meta|organic, page) without awaiting.
// Reveal → fireworks + the page's code → "Continue to Checkout" creates a
// Storefront cart (1 × selected SINGLE CAN, code applied, email prefilled) and
// redirects to Shopify checkout. Back from checkout returns to the reveal
// (sessionStorage, per code). The Spin & Save wheel never opens on these
// routes (SpinWheel.tsx onNoWheelPath).
//
// Peach Mango uses the corrected brand color #E59177 (products_.$slug.tsx still
// renders #E89B5B — fixing that is separate work). Card geometry mirrors
// FreeSampleSection (.fs-*) under the .tfc-* namespace (FreeCanLanding.css).

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { storefrontApiRequest } from "../lib/shopify";
import { readUtms, isAdVisitor } from "../lib/utms";
import {
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  getBasePx,
} from "../lib/sunrise-components";
import "./FreeCanLanding.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_MQ = "(max-width: 768px)"; // grid is 2-up at/below this, 3-up above

type Tier = 10 | 30 | 60;
type Cannabinoid = "CBG" | "CBN" | "THCV";
type Can = {
  slug: string;
  flavor: string;
  descriptor: string;
  color: string;
  tier: Tier;
  cannabinoid?: Cannabinoid;
  variantId: string;
  // Explicit name lines for 3-word flavors; the name block reserves 2 lines.
  nameLines?: string[];
};

const V = (id: string) => `gid://shopify/ProductVariant/${id}`;

// The 15 live SINGLE CAN variants (verified in Shopify Oct 5 2026).
const CANS: Can[] = [
  { slug: "10mg-strawberry", flavor: "Strawberry", descriptor: "Fresh + Fruity", color: "#CC1F39", tier: 10, variantId: V("67621433311444") },
  { slug: "10mg-watermelon", flavor: "Watermelon", descriptor: "Sweet + Juicy", color: "#0A6034", tier: 10, variantId: V("67621432197332") },
  { slug: "10mg-lemonade", flavor: "Lemonade", descriptor: "Crisp + Tangy", color: "#E0AD2C", tier: 10, variantId: V("67621433966804") },
  { slug: "30mg-peach-mango", flavor: "Peach Mango", descriptor: "Lush + Tropical", color: "#E59177", tier: 30, variantId: V("67621420695764") },
  { slug: "30mg-cherry-limeade", flavor: "Cherry Limeade", descriptor: "Tart + Refreshing", color: "#67092A", tier: 30, variantId: V("67621423677652") },
  { slug: "30mg-orange-lemonade", flavor: "Orange Lemonade", descriptor: "Bright + Tart", color: "#FAA819", tier: 30, variantId: V("67621422432468") },
  { slug: "30mg-kiwi-watermelon-cbg", flavor: "Kiwi Watermelon", descriptor: "Crisp + Cool", color: "#A4BC47", tier: 30, cannabinoid: "CBG", variantId: V("67621420105940") },
  { slug: "30mg-blueberry-pomegranate-cbn", flavor: "Blueberry Pomegranate", descriptor: "Tart + Vibrant", color: "#21285A", tier: 30, cannabinoid: "CBN", variantId: V("67621419581652") },
  { slug: "30mg-strawberry-watermelon-thcv", flavor: "Strawberry Watermelon", descriptor: "Sweet + Fresh", color: "#0A6034", tier: 30, cannabinoid: "THCV", variantId: V("67621414895828") },
  { slug: "60mg-wild-cherry-peach", flavor: "Wild Cherry Peach", descriptor: "Lush + Juicy", color: "#861625", tier: 60, variantId: V("67621510709460"), nameLines: ["Wild Cherry", "Peach"] },
  { slug: "60mg-blueberry-lemonade", flavor: "Blueberry Lemonade", descriptor: "Rich + Tangy", color: "#21285A", tier: 60, variantId: V("67621510742228") },
  { slug: "60mg-passionfruit-mango", flavor: "Passionfruit Mango", descriptor: "Bright + Breezy", color: "#60203A", tier: 60, variantId: V("67621447565524") },
  { slug: "60mg-blood-orange-cbg", flavor: "Blood Orange", descriptor: "Tart + Punchy", color: "#DC7F27", tier: 60, cannabinoid: "CBG", variantId: V("67621455823060") },
  { slug: "60mg-blackberry-cbn", flavor: "Blackberry", descriptor: "Dark + Smooth", color: "#2E1E3D", tier: 60, cannabinoid: "CBN", variantId: V("67621455266004") },
  { slug: "60mg-strawberry-kiwi-thcv", flavor: "Strawberry Kiwi", descriptor: "Sweet + Tangy", color: "#CC1F39", tier: 60, cannabinoid: "THCV", variantId: V("67621446975700") },
];
const TIERS: { tier: Tier; color: string }[] = [
  { tier: 10, color: "#CC1F39" },
  { tier: 30, color: "#0A6034" },
  { tier: 60, color: "#2E1E3D" },
];
const bySlug = (slug: string | null) => CANS.find((c) => c.slug === slug) ?? null;

// fysInk luminance rule: on light flavor colors (relative luminance > 0.3 —
// Lemonade, Orange Lemonade, Peach Mango, Kiwi Watermelon, Blood Orange),
// flavor-colored ink on cream is illegible, so flip it to near-black.
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const inkFor = (hex: string) => (luminance(hex) > 0.3 ? "#1A1A1A" : hex);

const tierLockup = (tier: Tier, base: number, color: string) =>
  tier === 10 ? render10mgLockup(base, color) : tier === 30 ? render30mgLockup(base, color) : render60mgLockup(base, color);
const cbLockup = (cb: Cannabinoid, base: number, color: string) =>
  cb === "CBG" ? renderCBGLockup(base, color) : cb === "CBN" ? renderCBNLockup(base, color) : renderTHCVLockup(base, color);

function readSaved(storageKey: string): { slug: string; claimed: boolean } | null {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const v = JSON.parse(raw) as { slug?: unknown; claimed?: unknown };
    if (typeof v.slug === "string" && v.claimed === true && bySlug(v.slug)) return { slug: v.slug, claimed: true };
  } catch {
    /* private browsing / bad JSON — start fresh */
  }
  return null;
}

// Fireworks — main's Spin & Save burst (SpinWheel.tsx Fireworks()), namespaced.
function Fireworks() {
  const bursts = [
    { top: "34%", left: "22%", color: "var(--tier-5)", delay: "0s" },
    { top: "28%", left: "72%", color: "var(--tier-10)", delay: "0.12s" },
    { top: "60%", left: "54%", color: "var(--tier-30)", delay: "0.26s" },
    { top: "44%", left: "44%", color: "var(--tier-60)", delay: "0.08s" },
  ];
  return (
    <div className="tfc-fireworks" aria-hidden="true">
      {bursts.map((b, i) => (
        <span key={i} className="tfc-burst" style={{ top: b.top, left: b.left, color: b.color, animationDelay: b.delay }}>
          {Array.from({ length: 12 }).map((_, j) => (
            <span key={j} className="tfc-particle" style={{ "--rotate": `${j * 30}deg` } as CSSProperties} />
          ))}
        </span>
      ))}
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type FreeCanCode = "TRYFREECAN" | "WEBFREECAN" | "FREECAN";

export function FreeCanLanding({ code }: { code: FreeCanCode }) {
  const STORAGE_KEY = `sunrise:freecan-landing:${code}`;
  const cbRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const tierHeadRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const panelLockupRef = useRef<HTMLSpanElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const revealRef = useRef<HTMLElement>(null);

  const [selected, setSelected] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cols, setCols] = useState<2 | 3>(3);
  const [caretX, setCaretX] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const current = bySlug(selected);

  // Suppress the legacy global wheel for this visit too (belt + braces with
  // NO_WHEEL_PATHS in SpinWheel.tsx). Restore a claimed visit (back from checkout).
  useEffect(() => {
    try {
      sessionStorage.setItem("sunrise:spin-wheel-seen", "true");
    } catch {
      /* harmless */
    }
    const saved = readSaved(STORAGE_KEY);
    if (saved) {
      setSelected(saved.slug);
      setClaimed(true); // no fireworks on restore — they play once, on the claim
    }
  }, [STORAGE_KEY]);

  // Paint the cannabinoid strips and the strength-group headings. The group
  // heading potency lockups are 2× the FreeSampleSection size (80 desktop / 60
  // phones). Cards carry NO potency lockup (founder, Oct 5) — the can art
  // already shows the strength. Re-paints on resize / fonts-ready, and when the
  // visible set changes.
  useEffect(() => {
    const paint = () => {
      const base = getBasePx();
      const mobile = window.innerWidth <= 768;
      CANS.forEach((c) => {
        const cb = cbRefs.current[c.slug];
        if (cb && c.cannabinoid) cb.innerHTML = cbLockup(c.cannabinoid, base * 0.91, "#FEFBE0");
      });
      TIERS.forEach((t) => {
        const el = tierHeadRefs.current[t.tier];
        if (el) el.innerHTML = tierLockup(t.tier, mobile ? 60 : 80, t.color);
      });
      // Claim panel: the selected can's potency lockup in its tier color.
      const sel = CANS.find((c) => c.slug === selected);
      const tierColor = sel ? TIERS.find((t) => t.tier === sel.tier)?.color : undefined;
      if (panelLockupRef.current && sel && tierColor) {
        panelLockupRef.current.innerHTML = tierLockup(sel.tier, mobile ? 34 : 44, tierColor);
      }
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [claimed, selected, cols]);

  // Track the grid's column count (matches the CSS breakpoint) so the claim
  // panel can be inserted after the last card of the selected card's row.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setCols(mq.matches ? 2 : 3);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Point the panel's caret at the selected card (works for the centered
  // orphan card too), and re-measure on resize.
  useLayoutEffect(() => {
    if (claimed || !selected) return;
    const measure = () => {
      const card = cardRefs.current[selected];
      const panel = panelRef.current;
      if (!card || !panel) return;
      const c = card.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      setCaretX(c.left + c.width / 2 - pr.left);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [selected, cols, claimed]);

  // When the panel opens or moves to another row, bring it into view.
  useEffect(() => {
    if (claimed || !selected) return;
    const id = window.requestAnimationFrame(() => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [selected, cols, claimed]);

  const select = (slug: string, focus = false) => {
    setSelected(slug);
    if (focus) cardRefs.current[slug]?.focus();
  };

  // Radio-group keyboard: arrows move + select (wrapping), Space/Enter select.
  const onCardKey = (e: KeyboardEvent<HTMLDivElement>, slug: string) => {
    const i = CANS.findIndex((c) => c.slug === slug);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % CANS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + CANS.length) % CANS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = CANS.length - 1;
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      select(slug);
      return;
    }
    if (next >= 0) {
      e.preventDefault();
      select(CANS[next].slug, true);
    }
  };

  const onClaim = async () => {
    if (!current || submitting) return; // the panel only exists once a can is selected
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 320) {
      setEmailError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setEmailError("");

    const showReveal = () => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ slug: current.slug, claimed: true }));
        sessionStorage.setItem("sunrise:spin-wheel-seen", "true"); // no second email ask this visit
      } catch {
        /* private mode */
      }
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      setCelebrate(!reduce);
      setClaimed(true);
      window.setTimeout(() => revealRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 30);
    };

    // Honeypot: real visitors never fill it. Reveal client-side, write nothing.
    if (company.trim()) {
      showReveal();
      return;
    }

    setSubmitting(true);
    try {
      // Same contract as FreeSampleSection's email gate: the Supabase write is
      // the only gate (duplicates return success)…
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "free-can" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setEmailError(data?.error || "Something went wrong. Please try again.");
        return;
      }
      // …then HubSpot (web_signup_source = Free Can, first-touch) and Klaviyo
      // (subscribe + "Claimed Free Can" with code/source/page) fire without
      // being awaited — neither may delay or fail the reveal. keepalive lets
      // them finish if the visitor heads to checkout right away.
      const utms = readUtms();
      const page = `${location.host.replace(/^www\./, "")}${location.pathname}`;
      fetch("/api/public/free-can-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, ...utms }),
        keepalive: true,
      }).catch(() => {});
      fetch("/api/public/free-can-klaviyo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, ...utms, code, source: isAdVisitor() ? "meta" : "organic", page }),
        keepalive: true,
      }).catch(() => {});
      setEmail(value);
      showReveal();
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  const goToCheckout = async () => {
    if (!current || checkoutBusy) return;
    setCheckoutBusy(true);
    setCheckoutError("");
    type CartCreateData = {
      cartCreate: {
        cart: { id: string; checkoutUrl: string; discountCodes: { code: string; applicable: boolean }[] } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    };
    try {
      const res = await storefrontApiRequest<CartCreateData>(
        `mutation cartCreate($input: CartInput!) {
          cartCreate(input: $input) {
            cart { id checkoutUrl discountCodes { code applicable } }
            userErrors { field message }
          }
        }`,
        {
          input: {
            lines: [{ merchandiseId: current.variantId, quantity: 1 }],
            discountCodes: [code],
            // Prefill checkout with the claimed email (production only).
            ...(EMAIL_RE.test(email) ? { buyerIdentity: { email } } : {}),
          },
        },
      );
      const payload = res?.data?.cartCreate;
      const cart = payload?.cart;
      if (!cart?.checkoutUrl) throw new Error(payload?.userErrors?.map((u) => u.message).join(", ") || "cartCreate returned no cart");
      const applied = cart.discountCodes.find((d) => d.code.toUpperCase() === code);
      if (!applied?.applicable || (payload?.userErrors?.length ?? 0) > 0) {
        // Still send them on — the visible code box is the fallback.
        console.warn("[freecan] discount not applicable or userErrors", { discountCodes: cart.discountCodes, userErrors: payload?.userErrors });
      }
      let url = cart.checkoutUrl;
      try {
        const u = new URL(url);
        u.searchParams.set("channel", "online_store"); // same as main formatCheckoutUrl()
        url = u.toString();
      } catch {
        /* keep the raw URL */
      }
      window.location.assign(url);
    } catch (err) {
      console.error("[freecan] checkout failed", err);
      setCheckoutError("Something went wrong. Please try again.");
      setCheckoutBusy(false);
    }
  };

  const renderCard = (c: Can, interactive: boolean) => {
    const isSel = selected === c.slug;
    const ink = inkFor(c.color);
    const tabStop = selected ? isSel : c.slug === CANS[0].slug;
    const style = { "--card-flavor-color": c.color, "--card-ink": ink } as CSSProperties;
    const body = (
      <>
        <div className="tfc-card-can" style={{ background: c.color }}>
          <img src={`/images/cans/${c.slug}.webp`} alt={`SUNRISE ${c.flavor} hemp-infused seltzer can`} width={960} height={1920} loading="lazy" decoding="async" />
          {c.cannabinoid && (
            <span className="tfc-card-cannabinoid" aria-hidden="true" ref={(el) => { cbRefs.current[c.slug] = el; }} />
          )}
          {interactive && (
            <span className="tfc-card-check" aria-hidden="true">
              <CheckIcon color={ink} />
            </span>
          )}
        </div>
        <div className="tfc-card-meta">
          <div className="tfc-card-name">
            {(c.nameLines ?? c.flavor.split(" ")).map((w, i, arr) => (
              <span key={i}>
                {w}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </div>
          <div className="tfc-card-descriptor">{c.descriptor}</div>
        </div>
      </>
    );
    if (!interactive) {
      return (
        <div className="tfc-card tfc-card--static" style={style}>
          {body}
        </div>
      );
    }
    return (
      <div
        key={c.slug}
        ref={(el) => { cardRefs.current[c.slug] = el; }}
        className={`tfc-card${isSel ? " is-selected" : ""}`}
        style={style}
        role="radio"
        aria-checked={isSel}
        aria-label={`${c.flavor}, ${c.descriptor}`}
        tabIndex={tabStop ? 0 : -1}
        onClick={() => select(c.slug)}
        onKeyDown={(e) => onCardKey(e, c.slug)}
      >
        {body}
      </div>
    );
  };

  // The claim panel ("Your pick" + email), rendered right after the last card
  // of the selected card's row.
  const claimPanel = current && (
    <div
      key="tfc-panel"
      ref={panelRef}
      className="tfc-panel"
      style={{ "--card-flavor-color": current.color, "--caret-x": caretX === null ? "50%" : `${caretX}px` } as CSSProperties}
      aria-labelledby="tfc-claim-title"
      role="region"
    >
      <span className="tfc-panel-caret" aria-hidden="true" />
      {/* Three lines (founder, Oct 5): "Your Pick" → potency lockup in its tier
          color → flavor name, always in the flavor color. */}
      <h2 id="tfc-claim-title" className="tfc-claim-title" aria-label={`Your pick: ${current.flavor}, ${current.tier} MG`}>
        <span className="tfc-claim-eyebrow" aria-hidden="true">Your Pick</span>
        <span className="tfc-claim-lockup" aria-hidden="true" ref={panelLockupRef} />
        <span className="tfc-claim-flavor" aria-hidden="true" style={{ color: current.color }}>{current.flavor}</span>
      </h2>
      <form
        className="tfc-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onClaim();
        }}
      >
        {/* Honeypot — invisible to people; if filled, nothing is written. */}
        <div className="tfc-hp" aria-hidden="true">
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
        <label htmlFor="tfc-email" className="tfc-label">Email address</label>
        <input
          ref={emailRef}
          id="tfc-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="tfc-input"
          placeholder="you@email.com"
          value={email}
          disabled={submitting}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? "tfc-email-error" : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError("");
          }}
        />
        {emailError && <p id="tfc-email-error" className="tfc-error">{emailError}</p>}
        <button type="submit" className="btn btn-primary tfc-claim-btn" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Claiming" : "Claim My Free Can"}
        </button>
        <p className="tfc-fine">
          By entering your email, you agree to receive marketing emails from SUNRISE. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );

  return (
    <>
      <SiteHeader />

      <main className="tfc-page">
        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="tfc-hero">
          <div className="container">
            <h1 className="tfc-headline">
              Want a Taste?<br />
              <span className="accent">Just Cover Shipping</span>
            </h1>
            <p className="tfc-subhead">
              Pick any flavor or strength and the can is on us. You just cover the shipping fee. One free can per order.
            </p>
          </div>
        </section>

        {!claimed ? (
          /* ── 02 · PICK (claim panel opens beneath the tapped row) ─────── */
          <section className="tfc-pick" aria-label="Choose your free can">
            <div className="container">
              <div
                className={`tfc-groups${selected ? " has-selection" : ""}`}
                role="radiogroup"
                aria-label="Choose your free can"
              >
                {TIERS.map((t) => {
                  const group = CANS.filter((c) => c.tier === t.tier);
                  const selIdx = group.findIndex((c) => c.slug === selected);
                  const insertAfter =
                    selIdx < 0 ? -1 : Math.min((Math.floor(selIdx / cols) + 1) * cols, group.length) - 1;
                  return (
                    <div key={t.tier} className="tfc-group" role="group" aria-label={`${t.tier} MG`}>
                      <div className="tfc-group-head">
                        <span className="tfc-group-lockup" aria-hidden="true" ref={(el) => { tierHeadRefs.current[t.tier] = el; }} />
                      </div>
                      <div className="tfc-grid">
                        {group.map((c, i) => (
                          <Fragment key={c.slug}>
                            {renderCard(c, true)}
                            {i === insertAfter && claimPanel}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          current && (
            <section className="tfc-reveal" ref={revealRef} aria-labelledby="tfc-reveal-title">
              <div className="container">
                <div className="tfc-reveal-burst">
                  {celebrate && <Fireworks />}
                  <h2 id="tfc-reveal-title" className="tfc-reveal-title">Your Free Can Is Saved</h2>
                </div>
                <div className="tfc-reveal-card">{renderCard(current, false)}</div>
                <button type="button" className="tfc-code" onClick={copyCode} title="Copy code">
                  <span className="tfc-code-text">{code}</span>
                  <span className="tfc-code-copy">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="tfc-copy-icon">
                      <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {copied ? "Copied!" : "Copy"}
                  </span>
                </button>
                <p className="tfc-fine tfc-code-note">
                  The code is applied for you at checkout. If it isn&rsquo;t, paste it in the discount field.
                </p>
                <button
                  type="button"
                  className="btn btn-primary tfc-checkout-btn"
                  onClick={goToCheckout}
                  disabled={checkoutBusy}
                  aria-busy={checkoutBusy}
                >
                  {checkoutBusy ? "Opening Checkout" : "Continue to Checkout"}
                </button>
                {checkoutError && <p className="tfc-error" role="alert">{checkoutError}</p>}
                <p className="tfc-fine">One free can per order. You just cover the shipping fee.</p>
              </div>
            </section>
          )
        )}
      </main>

      <SiteFooter />
    </>
  );
}
