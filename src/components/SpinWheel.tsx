// SPIN-TO-WIN — marketing popup that appears immediately after the 21+ age
// gate is cleared. Free to spin; the discount code is masked until the
// visitor submits an email.
//
// FLOW: idle → spinning (4s) → won (prize shown, code masked, email form)
//       → revealed (code + copy button + shop link).
//
// PERSISTENCE: per-session, same as AgeGate (sessionStorage). Abuse control
// lives in Shopify — each code is limited to one use per customer — so a new
// browsing session re-showing the wheel costs nothing.
//
// GATING: does not render until the age gate's sessionStorage flag is set.
// AgeGate dispatches `sunrise:age-verified` on YES; we also check the flag on
// mount so returning-in-session visitors (flag already true) still get it.
//
// OUTCOME: chosen up front from PRIZES via weighted random, then the final
// rotation is computed to land that segment under the pointer. The animation
// never decides the prize.
//
// DISMISSABLE: unlike the age gate this is marketing, not compliance — X
// button, ESC and backdrop click all close it.

import { useCallback, useEffect, useRef, useState } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";
import "./SpinWheel.css";

const STORAGE_KEY = "sunrise:spin-wheel-seen";
const AGE_KEY = "sunrise:age-verified";

// ── PRIZE TABLE ─────────────────────────────────────────────────────────
// Eight wheel segments. Each prize appears twice, never adjacent, so the
// wheel reads as a full color wheel rather than four fat quarters.
// `weight` controls likelihood (relative, per segment). `code` is the
// shared Shopify discount code handed out for that prize.
//
// TODO(codes): replace these placeholders with the real Shopify codes.
// Recommended Shopify setup per code: "Limit to one use per customer" +
// require customer email at checkout.
export type Prize = {
  label: string;
  sub: string;
  code: string;
  color: string;
  weight: number;
};

// One prize = one color, reusing only the four home-hero tier colors.
// `weight` = relative likelihood of THAT SEGMENT. Each prize occupies two
// segments, so its true odds are the sum of its two weights over the total.
// Example below: 10% = 6/16, 15% = 4/16, FREE SHIP = 4/16, 20% = 2/16.
// Edit the numbers freely — nothing else needs to change.
export const PRIZES: Prize[] = [
  { label: "10%", sub: "OFF", code: "SPIN10", color: "#DC7F27", weight: 3 },
  { label: "15%", sub: "OFF", code: "SPIN15", color: "#CC1F39", weight: 2 },
  { label: "20%", sub: "OFF", code: "SPIN20", color: "#0A6034", weight: 1 },
  { label: "FREE", sub: "SHIPPING", code: "SPINSHIP", color: "#2E1E3D", weight: 2 },
  { label: "10%", sub: "OFF", code: "SPIN10", color: "#DC7F27", weight: 3 },
  { label: "15%", sub: "OFF", code: "SPIN15", color: "#CC1F39", weight: 2 },
  { label: "20%", sub: "OFF", code: "SPIN20", color: "#0A6034", weight: 1 },
  { label: "FREE", sub: "SHIPPING", code: "SPINSHIP", color: "#2E1E3D", weight: 2 },
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

  // Show once the age gate is cleared and we haven't shown it this session.
  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const maybeShow = () => {
      try {
        if (sessionStorage.getItem(STORAGE_KEY) === "true") return;
        if (sessionStorage.getItem(AGE_KEY) !== "true") return;
      } catch {
        return;
      }
      setPhase((p) => (p === "hidden" ? "idle" : p));
    };

    maybeShow();
    window.addEventListener("sunrise:age-verified", maybeShow);
    return () => window.removeEventListener("sunrise:age-verified", maybeShow);
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
      if (wmRef.current) wmRef.current.innerHTML = renderWordmark(getBasePx() * 0.8, "gradient");
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
            aria-label="Prize wheel with 8 discount segments"
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
            <p className="spin-body">
              Spin wheel for a discount code on your first order, up to 20% off.
              Exclusions, terms, and conditions apply.
            </p>
            <button type="button" className="spin-btn spin-btn-primary" onClick={spin} autoFocus>
              Spin the Wheel
            </button>
          </>
        )}

        {phase === "spinning" && <p className="spin-body">Good luck&hellip;</p>}

        {phase === "won" && prize && (
          <>
            <p className="spin-prize">
              {prize.label} {prize.sub}
            </p>
            <form className="spin-form" onSubmit={submitEmail}>
              <label className="spin-label" htmlFor="spin-email">
                Enter your email to unlock your code
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
            <p className="spin-prize">
              {prize.label} {prize.sub}
            </p>
            <button type="button" className="spin-code" onClick={copyCode} title="Copy code">
              <span className="spin-code-text">{prize.code}</span>
              <span className="spin-code-copy">{copied ? "Copied!" : "Copy"}</span>
            </button>
            <a className="spin-btn spin-btn-primary" href="/products" onClick={close}>
              Shop Now
            </a>
            <p className="spin-fine">
              One use per customer. Apply at checkout. Exclusions, terms, and
              conditions apply.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
