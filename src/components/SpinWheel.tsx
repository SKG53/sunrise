// SPIN-TO-WIN — marketing popup. The 21+ age gate stays immediate and blocks
// the page; once it's cleared, the wheel does NOT pop right away. It arms a set
// of delayed triggers and appears on the first of: a 10s floor... (see GATING).
// Free to spin; the discount code is masked until the visitor submits an email.
//
// FLOW: idle → spinning (4s) → won (prize shown, code masked, email form)
//       → revealed (code + copy button + shop link).
//
// PERSISTENCE: per-session, same as AgeGate (sessionStorage). Abuse control
// lives in Shopify — each code is limited to one use per customer — so a new
// browsing session re-showing the wheel costs nothing.
//
// GATING: never shows until age is verified (AgeGate dispatches
// `sunrise:age-verified`; we also check the flag on mount for returning-in-
// session visitors). Once eligible we ARM triggers and reveal on whichever
// fires first: scrolling through ~70% of the Simple Ingredients cards
// (.s03-card-grid) — which fires on its own, no time gate — a 10s time
// fallback, or desktop exit-intent (guarded for the first 2s). Nothing can
// fire while the age gate is up, since we only arm after age-verification.
//
// OUTCOME: chosen up front from PRIZES via weighted random, then the final
// rotation is computed to land that segment under the pointer. The animation
// never decides the prize.
//
// DISMISSABLE: unlike the age gate this is marketing, not compliance — X
// button, ESC and backdrop click all close it.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";
import "./SpinWheel.css";

const STORAGE_KEY = "sunrise:spin-wheel-seen";
const AGE_KEY = "sunrise:age-verified";
// Persistent (localStorage) suppression for visitors who arrive from the
// srbev.com lander after spinning there (URL carries ?ref=srbev). Unlike
// STORAGE_KEY (per-session dismissal), this survives future sessions so a
// visitor who already spun on the lander is never re-prompted here. Direct
// visitors never get this key set, so they see the popup normally.
const SUPPRESS_KEY = "sunrise:spin-suppressed";

// ── PRIZE TABLE ─────────────────────────────────────────────────────────
// Ten wheel segments. The wheel is split across five prizes:
// 5% (2 segments), 10% (2), 15% (2), 20% (2), and Free Shipping (2).
// The same prize always uses the same color, and no identical prize is ever
// adjacent. `weight` controls likelihood of THAT SEGMENT; the true odds are
// the sum of that prize's segment weights over the total.
//
// Current odds: Free Shipping 20%, 5% 35%, 10% 25%, 15% 11%, 20% 9%.
//
// Recommended Shopify setup per code: "Limit to one use per customer" +
// require customer email at checkout.
export type Prize = {
  label: string;
  sub: string;
  code: string;
  color: string;
  weight: number;
};

// The five colors are brand-adjacent: the four hero tier colors plus plum
// for the 5% slice. `weight` is per segment; multiply by segment count
// to get each prize's contribution to the total. Adjust any numbers freely.
export const PRIZES: Prize[] = [
  { label: "5%", sub: "OFF", code: "SRSPINWIN5OFF", color: "#822665", weight: 15 },
  { label: "10%", sub: "OFF", code: "SRSPINWIN10OFF", color: "#DC7F27", weight: 35 },
  { label: "15%", sub: "OFF", code: "SRSPINWIN15OFF", color: "#CC1F39", weight: 20 },
  { label: "FREE", sub: "SHIPPING", code: "SRSPINFREESHIP", color: "#2E1E3D", weight: 20 },
  { label: "20%", sub: "OFF", code: "SRSPINWIN20OFF", color: "#0A6034", weight: 10 },
  { label: "5%", sub: "OFF", code: "SRSPINWIN5OFF", color: "#822665", weight: 15 },
  { label: "10%", sub: "OFF", code: "SRSPINWIN10OFF", color: "#DC7F27", weight: 35 },
  { label: "15%", sub: "OFF", code: "SRSPINWIN15OFF", color: "#CC1F39", weight: 20 },
  { label: "FREE", sub: "SHIPPING", code: "SRSPINFREESHIP", color: "#2E1E3D", weight: 20 },
  { label: "20%", sub: "OFF", code: "SRSPINWIN20OFF", color: "#0A6034", weight: 10 },
];

const SEG = 360 / PRIZES.length;
const SPIN_MS = 4200;
const TURNS = 6;

type Phase = "hidden" | "idle" | "spinning" | "won" | "revealed";

// Weighted pick over PRIZES; returns the winning segment INDEX.
function pickIndex(): number {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    r -= PRIZES[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

// Polar → cartesian with 0° at 12 o'clock, angles increasing clockwise.
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

function PrizeWithFireworks({ prize }: { prize: Prize }) {
  const bursts = [
    { top: "40%", left: "24%", color: "var(--tier-5)", delay: "0s" },
    { top: "34%", left: "70%", color: "var(--tier-10)", delay: "0.12s" },
    { top: "64%", left: "52%", color: "var(--tier-30)", delay: "0.28s" },
    { top: "48%", left: "46%", color: "var(--tier-60)", delay: "0.08s" },
  ];
  return (
    <div className="spin-prize-wrap">
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
      <p className="spin-prize">
        {prize.label} {prize.sub}
      </p>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SpinWheel() {
  const [phase, setPhase] = useState<Phase>("hidden");
  const [winner, setWinner] = useState<number | null>(null);
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
  // reveals on the first of: 10s floor, scroll past 70% of the Simple Ingredients
  // cards, 15s fallback, or desktop exit-intent. The floor counts from arming
  // (i.e. from age-verification), so nothing fires while the gate is still up.
  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cross-domain hand-off (Option B): if this visitor arrived from the
    // srbev.com lander AFTER spinning there, the lander appended ?ref=srbev to
    // the link. Persistently suppress the main-site Spin & Save so they're never
    // re-prompted. The param is left in the URL intact for analytics/attribution.
    try {
      if (new URLSearchParams(window.location.search).get("ref") === "srbev") {
        localStorage.setItem(SUPPRESS_KEY, "true");
      }
    } catch {
      /* URL or localStorage unavailable — fall through to normal behavior */
    }

    const FALLBACK_MS = 10000; // time-based fallback if they neither scroll nor exit
    const EXIT_GUARD_MS = 2000; // don't count exit-intent in the first moment
    let armed = false;
    let done = false;
    let armedAt = 0;
    const timers: number[] = [];

    const eligible = () => {
      try {
        if (localStorage.getItem(SUPPRESS_KEY) === "true") return false;
        if (sessionStorage.getItem(STORAGE_KEY) === "true") return false;
        if (sessionStorage.getItem(AGE_KEY) !== "true") return false;
      } catch {
        return false;
      }
      return true;
    };
    const onScroll = () => {
      // Fires on its own — NOT gated by the time fallback — so scrolling through
      // the Simple Ingredients cards can trigger the wheel before the 10s mark.
      const el = document.querySelector(".s03-card-grid");
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Fire once the 70%-height point of the cards passes above the vertical
      // middle of the viewport — i.e. the visitor has scrolled through ~70% of
      // the cards while they're still on screen.
      if (r.top + r.height * 0.7 <= window.innerHeight / 2) reveal();
    };
    const onMouseOut = (e: MouseEvent) => {
      if (Date.now() - armedAt < EXIT_GUARD_MS) return;
      if (e.relatedTarget) return; // moved to another element, not out of window
      if ((e.clientY ?? 1) <= 0) reveal(); // left via the top edge (exit-intent)
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
      onScroll(); // in case the visitor is already past the cards on arm
    };

    arm(); // returning-in-session (already age-verified) arms right away
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
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(getBasePx() * (window.matchMedia("(max-width: 768px)").matches ? 0.95 : 0.8), "gradient");
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [phase]);

  const spin = () => {
    if (phase !== "idle") return;
    const idx = pickIndex();
    setWinner(idx);
    // Land the centre of segment `idx` under the pointer at 12 o'clock.
    const target = TURNS * 360 - (idx * SEG + SEG / 2);
    if (reduced.current) {
      setRotation(-(idx * SEG + SEG / 2));
      setPhase("won");
      return;
    }
    setRotation(target);
    setPhase("spinning");
    window.setTimeout(() => setPhase("won"), SPIN_MS);
  };

  const prize = winner === null ? null : PRIZES[winner];

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
      // Non-blocking dual-write to HubSpot (spec v2). Fired in parallel and
      // deliberately NOT awaited — the reward reveal below must never wait on
      // (or fail because of) HubSpot. The Supabase write above remains the sole
      // reward gate. A rejected fetch is swallowed so it can't surface an error.
      fetch("/api/public/spin-wheel-hubspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      }).catch(() => {});
      setPhase("revealed");

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!prize) return;
    try {
      await navigator.clipboard.writeText(prize.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  if (phase === "hidden") return null;

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

        <div className="spin-wheel-wrap">
          <div className="spin-pointer" aria-hidden="true" />
          <svg
            className="spin-wheel"
            viewBox="0 0 200 200"
            role="img"
            aria-label="Prize wheel with 10 discount segments"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition:
                phase === "spinning"
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
                  : "none",
            }}
          >
            {PRIZES.map((p, i) => (
              <path key={`seg-${i}`} d={segmentPath(i)} fill={p.color} />
            ))}
            {PRIZES.map((p, i) => (
              <g key={`txt-${i}`} transform={`rotate(${i * SEG + SEG / 2} 100 100)`}>
                <text x="100" y="34" className="spin-seg-label" textAnchor="middle">
                  {p.label}
                </text>
                <text
                  x="100"
                  y="48"
                  className={`spin-seg-sub${p.sub.length > 4 ? " spin-seg-sub-long" : ""}`}
                  textAnchor="middle"
                >
                  {p.sub}
                </text>
              </g>
            ))}
            <circle cx="100" cy="100" r="94" className="spin-rim" />
            <circle cx="100" cy="100" r="15" className="spin-hub" />
          </svg>
        </div>

        {phase === "idle" && (
          <>
            <button type="button" className="spin-btn spin-btn-primary" onClick={spin} autoFocus>
              Spin the Wheel
            </button>
            <p className="spin-fine">
              Spin the wheel and save on your first order. Applicable on any
              20 packs or fewer. Exclusions, terms, and conditions apply.
            </p>
          </>
        )}

        {phase === "spinning" && <p className="spin-body">Good luck&hellip;</p>}

        {phase === "won" && prize && (
          <>
            <PrizeWithFireworks prize={prize} />
            <form className="spin-form" onSubmit={submitEmail}>
              <label className="spin-label" htmlFor="spin-email">
                Enter your email and unlock your savings!
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
          </>
        )}

        {phase === "revealed" && prize && (
          <>
            <PrizeWithFireworks prize={prize} />
            <button type="button" className="spin-code" onClick={copyCode} title="Copy code">
              <span className="spin-code-text">{prize.code}</span>
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
              One use per customer, enter code at checkout. Applicable on any
              20 packs or fewer. Exclusions, terms, and conditions apply.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
