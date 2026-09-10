// SPIN & SAVE — two-pool, two-spin, pick-one marketing popup.
//
// WHAT THE CUSTOMER SEES: one wheel. They spin once (a deal drops into the
// bottom-LEFT saved slot), press "Spin Again" once (a second deal drops into
// the bottom-RIGHT slot), then click under whichever of the two they want to
// keep. That choice runs the same email→code flow as before and reveals only
// the chosen code; the other is discarded, never shown.
//
// INVISIBLE MATH (two pools): spin 1 draws only from the BIG-CART pool, spin 2
// only from the SMALL-CART pool. Each pool is an independent weighted draw whose
// weights sum to 100 on their own. The customer never sees pool labels — it's
// just organization + odds on our side. The single wheel shows all six deals;
// each spin's weighted pick is restricted to its pool's segments, and the
// rotation lands that segment. As before, the prize is decided BEFORE the
// animation — the spin never decides the outcome.
//
// PRESERVED FROM THE ORIGINAL (unchanged behavior): age-gated arming
// (`sunrise:age-verified` + `AGE_KEY`, ~70% scroll of `.s03-card-grid`, 10s
// fallback, desktop exit-intent w/ 2s guard), STORAGE_KEY (per-session dismiss)
// + SUPPRESS_KEY (cross-domain suppression — now DISABLED, see note below),
// email-gates-reveal via the
// Supabase `POST /api/public/newsletter` (source "spin-wheel"), non-blocking
// HubSpot dual-write w/ readUtms(), wordmark render, reduced-motion path,
// ESC/backdrop/X dismiss, body-scroll-lock. The email gate now fires AFTER the
// customer picks their deal.
//
// DISCOUNT CODES: NEWCUST* are the new campaign codes; the two flats reuse the
// existing SRSPINWIN15OFF / SRSPINWIN20OFF (20-pack-or-fewer). All are
// "one use per customer" in Shopify.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";
import { readUtms } from "../lib/utms";
import "./SpinWheel.css";

const STORAGE_KEY = "sunrise:spin-wheel-seen";
const AGE_KEY = "sunrise:age-verified";
// DISABLED (2026-09-10): cross-domain Spin & Save suppression. This existed for
// when the srbev.com lander had its OWN spin wheel — a visitor who spun there
// arrived with ?ref=srbev and we permanently suppressed the main-site wheel so
// they weren't re-prompted. The lander no longer has its own wheel (live funnel
// is age-gate-only), so a ?ref=srbev visitor has NOT spun and SHOULD see Spin &
// Save here. Kept commented for reference in case the lander wheel ever returns.
// const SUPPRESS_KEY = "sunrise:spin-suppressed";

// ── DEALS ───────────────────────────────────────────────────────────────
// Five deals across two hidden pools. `pool` decides which spin can land it;
// `weight` is that deal's odds WITHIN ITS POOL (each pool sums to 100).
// `hook` is the attention grab (the % or "FREE") shown large; `rest` is the
// small qualifier. `title` + `terms` show on the saved cards / reveal.
export type Pool = "big" | "small";
export type Deal = {
  key: string;
  pool: Pool;
  hook: string;   // large emphasis on wheel + cards
  sub: string;    // small line on the wheel segment
  rest: string;   // small qualifier on the saved card
  title: string;  // full human-readable deal
  terms: string;  // per-deal fine print
  code: string;
  color: string;
  weight: number; // within-pool odds
};

export const DEALS: Deal[] = [
  // Wheel/segment order below is also the visual order (6 segments). Colors and
  // the two FREE deals are arranged so no two similar colors — and neither FREE
  // — sit adjacent. Each spin's weighted pick is restricted to its pool.

  // — SMALL-CART pool (spin 2 → bottom-right) —
  {
    key: "2pk25",
    pool: "small",
    hook: "25%",
    sub: "OFF",
    rest: "OFF",
    title: "Buy any (2) 4-packs and take 25% off",
    terms: "Buy any (2) 4-packs and take 25% off.",
    code: "NEWCUST2P25",
    color: "#CC1F39",
    weight: 30,
  },
  // — BIG-CART pool (spin 1 → bottom-left) —
  {
    key: "buy4free",
    pool: "big",
    hook: "FREE",
    sub: "4-PACK",
    rest: "ANY 4-PACK",
    title: "Buy any four 4-packs, get any 4-pack FREE",
    terms: "Buy any four 4-packs, get any 4-pack FREE.",
    code: "NEWCUST4P1FR",
    color: "#2E1E3D",
    weight: 65,
  },
  // — SMALL-CART —
  {
    key: "flat15",
    pool: "small",
    hook: "15%",
    sub: "OFF",
    rest: "OFF",
    title: "Take 15% off any product 20-pack or fewer",
    terms: "Take 15% off any product 20-pack or fewer.",
    code: "SRSPINWIN15OFF",
    color: "#DC7F27",
    weight: 10,
  },
  // — SMALL-CART — (new: buy 2, get a 10mg 4-pack free) —
  {
    key: "buy2free10",
    pool: "small",
    hook: "FREE",
    sub: "4-PACK",
    rest: "10MG 4-PACK",
    title: "Buy any 2 4-packs, get a 10mg 4-pack FREE",
    terms: "Buy any 2 4-packs, get a 10mg 4-pack FREE.",
    code: "NEWCUST2P10MG",
    color: "#C21E63",
    weight: 45,
  },
  // — BIG-CART —
  {
    key: "buy5-30",
    pool: "big",
    hook: "30%",
    sub: "OFF",
    rest: "OFF",
    title: "Mix and match any (5) 4-packs and take 30% off",
    terms: "Mix and match any (5) 4-packs and take 30% off.",
    code: "NEWCUST5P30",
    color: "#0A6034",
    weight: 35,
  },
  // — SMALL-CART —
  {
    key: "flat20",
    pool: "small",
    hook: "20%",
    sub: "OFF",
    rest: "OFF",
    title: "Take 20% off any product 20-pack or fewer",
    terms: "Take 20% off any product 20-pack or fewer.",
    code: "SRSPINWIN20OFF",
    color: "#822665",
    weight: 15,
  },
];

const SEG = 360 / DEALS.length; // 72° per segment (5 deals)
const SPIN_MS = 4200;
const TURNS = 6;
const GENERIC_TERMS =
  "One use per customer. Enter code at checkout. Exclusions, terms, and conditions apply.";

type Phase =
  | "hidden"
  | "idle"
  | "spinning1"
  | "landed1"
  | "spinning2"
  | "choose"
  | "email"
  | "revealed";

// Weighted pick restricted to a single pool; returns the DEALS index.
function pickIndexInPool(pool: Pool): number {
  const entries = DEALS.map((d, i) => ({ d, i })).filter((e) => e.d.pool === pool);
  const total = entries.reduce((s, e) => s + e.d.weight, 0);
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.d.weight;
    if (r <= 0) return e.i;
  }
  return entries[0].i;
}

// Final wheel orientation (deg) that centers segment `idx` under the 12 o'clock
// pointer, normalized to [0,360).
function finalOrientation(idx: number): number {
  const raw = -(idx * SEG + SEG / 2);
  return ((raw % 360) + 360) % 360;
}

// Next cumulative rotation: from `current`, spin TURNS full turns forward and
// land segment `idx` centered under the pointer. Works for both spins.
function nextRotation(current: number, idx: number): number {
  const targetMod = finalOrientation(idx);
  const currentMod = ((current % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  return current + TURNS * 360 + delta;
}

// Polar → cartesian, 0° at 12 o'clock, increasing clockwise.
function pt(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}
function segmentPath(i: number) {
  const a0 = i * SEG;
  const a1 = a0 + SEG;
  const [x0, y0] = pt(100, 100, 94, a0);
  const [x1, y1] = pt(100, 100, 94, a1);
  return `M 100 100 L ${x0.toFixed(2)} ${y0.toFixed(2)} A 94 94 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

// Small fireworks burst reused for a freshly-landed deal card.
function Fireworks() {
  const bursts = [
    { top: "34%", left: "22%", color: "var(--tier-5)", delay: "0s" },
    { top: "28%", left: "72%", color: "var(--tier-10)", delay: "0.12s" },
    { top: "60%", left: "54%", color: "var(--tier-30)", delay: "0.26s" },
    { top: "44%", left: "44%", color: "var(--tier-60)", delay: "0.08s" },
  ];
  return (
    <div className="spin-fireworks" aria-hidden="true">
      {bursts.map((b, i) => (
        <span
          key={i}
          className="spin-burst"
          style={{ top: b.top, left: b.left, color: b.color, animationDelay: b.delay }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <span
              key={j}
              className="spin-particle"
              style={{ "--rotate": `${j * 30}deg` } as CSSProperties}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

// A saved-deal card: hook (large, deal-colored) + rest + title. `fresh` plays a
// one-time fireworks burst. `onKeep` (choose phase) renders the keep button.
function DealCard({
  deal,
  fresh,
  onKeep,
}: {
  deal: Deal;
  fresh?: boolean;
  onKeep?: () => void;
}) {
  return (
    <div className="spin-saved-slot">
      {fresh && <Fireworks />}
      <div className="spin-saved-inner">
        <span className="spin-saved-hook" style={{ color: deal.color }}>
          {deal.hook}
        </span>
        <span className="spin-saved-rest">{deal.rest}</span>
        <span className="spin-saved-title">{deal.title}</span>
      </div>
      {onKeep && (
        <button type="button" className="spin-btn spin-btn-primary spin-keep-btn" onClick={onKeep}>
          Keep This Deal
        </button>
      )}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SpinWheel() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [deal1, setDeal1] = useState<number | null>(null); // big pool (left)
  const [deal2, setDeal2] = useState<number | null>(null); // small pool (right)
  const [chosen, setChosen] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduced = useRef(false);
  const wmRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* private browsing — popup simply reappears next mount */
    }
    setPhase("hidden");
  }, []);

  // Age gate stays immediate; the wheel arms delayed triggers once eligible and
  // reveals on the first of: ~70% scroll of the Simple Ingredients cards, a 10s
  // fallback, or desktop exit-intent. Unchanged from the original.
  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // DISABLED (2026-09-10) — cross-domain suppression, see SUPPRESS_KEY note
    // above. Was: on ?ref=srbev, persistently suppress the main-site wheel for
    // visitors who had already spun on the lander.
    // try {
    //   if (new URLSearchParams(window.location.search).get("ref") === "srbev") {
    //     localStorage.setItem(SUPPRESS_KEY, "true");
    //   }
    // } catch {
    //   /* URL or localStorage unavailable — fall through to normal behavior */
    // }

    const FALLBACK_MS = 10000;
    const EXIT_GUARD_MS = 2000;
    let armed = false;
    let done = false;
    let armedAt = 0;
    const timers: number[] = [];

    const eligible = () => {
      try {
        // DISABLED (2026-09-10) — cross-domain suppression removed; see note above.
        // if (localStorage.getItem(SUPPRESS_KEY) === "true") return false;
        if (sessionStorage.getItem(STORAGE_KEY) === "true") return false;
        if (sessionStorage.getItem(AGE_KEY) !== "true") return false;
      } catch {
        return false;
      }
      return true;
    };
    const onScroll = () => {
      const el = document.querySelector(".s03-card-grid");
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top + r.height * 0.7 <= window.innerHeight / 2) reveal();
    };
    const onMouseOut = (e: MouseEvent) => {
      if (Date.now() - armedAt < EXIT_GUARD_MS) return;
      if (e.relatedTarget) return;
      if ((e.clientY ?? 1) <= 0) reveal();
    };
    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
      timers.forEach((t) => clearTimeout(t));
    };
    const reveal = () => {
      if (done) return;
      done = true;
      cleanup();
      setPhase((p) => (p === "hidden" ? "idle" : p));
    };
    const arm = () => {
      if (armed || done || !eligible()) return;
      armed = true;
      armedAt = Date.now();
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("mouseout", onMouseOut);
      timers.push(window.setTimeout(reveal, FALLBACK_MS));
      onScroll();
    };

    arm();
    window.addEventListener("sunrise:age-verified", arm);
    return () => {
      cleanup();
      window.removeEventListener("sunrise:age-verified", arm);
    };
  }, []);

  // Body scroll lock + ESC to dismiss while visible.
  useEffect(() => {
    if (phase === "hidden") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, close]);

  // SUNRISE wordmark, same renderer/treatment as the age gate.
  useEffect(() => {
    if (phase === "hidden") return;
    const paint = () => {
      if (wmRef.current)
        wmRef.current.innerHTML = renderWordmark(
          getBasePx() * (window.matchMedia("(max-width: 768px)").matches ? 0.95 : 0.8),
          "gradient"
        );
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [phase]);

  // Spin 1 — BIG-CART pool → bottom-left slot.
  const spin1 = () => {
    if (phase !== "idle") return;
    const idx = pickIndexInPool("big");
    setDeal1(idx);
    if (reduced.current) {
      setRotation(finalOrientation(idx));
      setPhase("landed1");
      return;
    }
    setRotation((cur) => nextRotation(cur, idx));
    setPhase("spinning1");
    window.setTimeout(() => setPhase("landed1"), SPIN_MS);
  };

  // Spin 2 — SMALL-CART pool → bottom-right slot. The one added button press.
  const spin2 = () => {
    if (phase !== "landed1") return;
    const idx = pickIndexInPool("small");
    setDeal2(idx);
    if (reduced.current) {
      setRotation((cur) => nextRotation(cur, idx));
      setPhase("choose");
      return;
    }
    setRotation((cur) => nextRotation(cur, idx));
    setPhase("spinning2");
    window.setTimeout(() => setPhase("choose"), SPIN_MS);
  };

  const pick = (idx: number) => {
    setChosen(idx);
    setError(null);
    setPhase("email");
  };

  const chosenDeal = chosen === null ? null : DEALS[chosen];

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "spin-wheel" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      // Non-blocking dual-write to HubSpot — fired in parallel, deliberately NOT
      // awaited; the reveal must never wait on or fail because of HubSpot. The
      // Supabase write above is the sole reward gate.
      fetch("/api/public/spin-wheel-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, ...readUtms() }),
      }).catch(() => {});
      setPhase("revealed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!chosenDeal) return;
    try {
      await navigator.clipboard.writeText(chosenDeal.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  if (phase === "hidden") return null;

  const showWheel =
    phase === "idle" ||
    phase === "spinning1" ||
    phase === "landed1" ||
    phase === "spinning2" ||
    phase === "choose";
  const showSaved =
    phase === "landed1" || phase === "spinning2" || phase === "choose";
  const spinning = phase === "spinning1" || phase === "spinning2";

  return (
    <div className="spin" role="dialog" aria-modal="true" aria-labelledby="spin-heading">
      <div className="spin-backdrop" onClick={close} aria-hidden="true" />
      <div className="spin-card">
        <button type="button" className="spin-close" onClick={close} aria-label="Close">
          &times;
        </button>

        <div className="spin-wordmark" ref={wmRef} aria-hidden="true" />
        <h2 id="spin-heading" className="spin-heading">
          Spin &amp; Save
        </h2>

        {showWheel && (
          <div className="spin-wheel-wrap">
            <div className="spin-pointer" aria-hidden="true" />
            <svg
              className="spin-wheel"
              viewBox="0 0 200 200"
              role="img"
              aria-label="Prize wheel with six deal segments"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
                  : "none",
              }}
            >
              {DEALS.map((d, i) => (
                <path key={`seg-${i}`} d={segmentPath(i)} fill={d.color} />
              ))}
              {DEALS.map((d, i) => (
                <g key={`txt-${i}`} transform={`rotate(${i * SEG + SEG / 2} 100 100)`}>
                  <text x="100" y="40" className="spin-seg-label" textAnchor="middle">
                    {d.hook}
                  </text>
                  <text x="100" y="54" className="spin-seg-sub" textAnchor="middle">
                    {d.sub}
                  </text>
                </g>
              ))}
              <circle cx="100" cy="100" r="94" className="spin-rim" />
              <circle cx="100" cy="100" r="15" className="spin-hub" />
            </svg>
          </div>
        )}

        {phase === "idle" && (
          <>
            <button type="button" className="spin-btn spin-btn-primary" onClick={spin1} autoFocus>
              Spin the Wheel
            </button>
            <p className="spin-fine">
              {GENERIC_TERMS}
            </p>
          </>
        )}

        {phase === "spinning1" && <p className="spin-body">Good luck&hellip;</p>}

        {/* Saved slots: left = spin 1 (big cart), right = spin 2 (small cart). */}
        {showSaved && (
          <>
            <div className="spin-saved-row">
              <div className="spin-saved-col">
                {deal1 !== null && (
                  <DealCard
                    deal={DEALS[deal1]}
                    fresh={phase === "landed1"}
                    onKeep={phase === "choose" ? () => pick(deal1) : undefined}
                  />
                )}
              </div>
              <div className="spin-saved-col">
                {deal2 !== null && phase === "choose" ? (
                  <DealCard
                    deal={DEALS[deal2]}
                    fresh={phase === "choose"}
                    onKeep={phase === "choose" ? () => pick(deal2) : undefined}
                  />
                ) : (
                  <div className="spin-saved-slot is-pending" aria-hidden="true">
                    <div className="spin-saved-inner">
                      <span className="spin-saved-hook spin-saved-hook-pending">?</span>
                      <span className="spin-saved-rest">SPIN AGAIN</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {phase === "landed1" && (
          <>
            <button type="button" className="spin-btn spin-btn-primary" onClick={spin2} autoFocus>
              Spin Again
            </button>
            <p className="spin-fine">Spin twice and keep your favorite deal.</p>
          </>
        )}

        {phase === "spinning2" && <p className="spin-body">One more&hellip;</p>}

        {phase === "email" && chosenDeal && (
          <>
            <div className="spin-chosen">
              <Fireworks />
              <span className="spin-chosen-hook" style={{ color: chosenDeal.color }}>
                {chosenDeal.hook}
              </span>
              <span className="spin-chosen-rest">{chosenDeal.rest}</span>
              <span className="spin-chosen-title">{chosenDeal.title}</span>
            </div>
            <form className="spin-form" onSubmit={submitEmail}>
              <label className="spin-label" htmlFor="spin-email">
                Enter your email to unlock this code
              </label>
              <input
                id="spin-email"
                type="email"
                className="spin-input"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="spin-error">{error}</p>}
              <button type="submit" className="spin-btn spin-btn-primary" disabled={submitting}>
                {submitting ? "Unlocking\u2026" : "Unlock My Code"}
              </button>
            </form>
            <p className="spin-fine">
              {GENERIC_TERMS}
            </p>
          </>
        )}

        {phase === "revealed" && chosenDeal && (
          <>
            <div className="spin-chosen">
              <Fireworks />
              <span className="spin-chosen-hook" style={{ color: chosenDeal.color }}>
                {chosenDeal.hook}
              </span>
              <span className="spin-chosen-rest">{chosenDeal.rest}</span>
              <span className="spin-chosen-title">{chosenDeal.title}</span>
            </div>
            <button type="button" className="spin-code" onClick={copyCode} title="Copy code">
              <span className="spin-code-text">{chosenDeal.code}</span>
              <span className="spin-code-copy">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="spin-copy-icon">
                  <rect x="8" y="8" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <rect x="3" y="3" width="13" height="13" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
            <a className="spin-btn spin-btn-primary" href="/products" onClick={close}>
              Shop Now
            </a>
            <p className="spin-fine">
              {GENERIC_TERMS}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
