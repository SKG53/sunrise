// 21+ AGE GATE — site-wide compliance modal mounted from __root.tsx so it
// renders ahead of every route. Two visible states inside one fixed-size
// frame: (1) question — "Are you 21 or older?" with YES/NO buttons; (2)
// refusal — same frame, swapped copy when user clicks NO. NO is terminal:
// no way back, no dismiss path, gate stays up. YES sets a per-session flag
// in sessionStorage and unmounts.
//
// PERSISTENCE: per-session. sessionStorage clears when the browser tab
// closes; new tabs open fresh. This is intentionally aggressive — every
// new browsing session re-prompts. Spec was per-session, not 30-day.
//
// SSR: sessionStorage is browser-only. Component renders nothing on server
// + first client paint, then a useEffect post-mount reads the flag and
// shows the gate if needed. ~50ms flash of underlying page is the
// standard SSR-gate tradeoff and acceptable for per-session UX.
//
// SCROLL: body scroll-locked while gate is visible (overflow: hidden).
// Cleanup on YES restores natural scroll. Refusal state keeps the lock —
// user can't scroll the underlying page.
//
// FOCUS / KEYBOARD: YES button gets autoFocus on mount. Tab cycles between
// YES and NO naturally. ESC is intentionally NOT bound — compliance gate
// should not be keyboard-dismissable.

import { useEffect, useRef, useState } from "react";
import { renderWordmark, getBasePx } from "../lib/sunrise-components";
import { track } from "../lib/track";

const STORAGE_KEY = "sunrise:age-verified";

type GateState = "hidden" | "question" | "refused";

export function AgeGate() {
  const [state, setState] = useState<GateState>("hidden");
  const wmRef = useRef<HTMLDivElement>(null);

  // Post-mount: check sessionStorage. If not verified this session, show
  // the question. Wrapped in try/catch because sessionStorage can throw in
  // private browsing / disabled-cookies contexts; failing closed (showing
  // gate) is the conservative choice for compliance.
  useEffect(() => {
    // Cross-domain age passthrough (STRICT): a visitor who already passed the
    // gate on srbev.com arrives on the Yes-click link carrying ?av=srbev. Since
    // srbev and savorsunrise are different root domains, no cookie can carry the
    // verified state — this URL flag is the only bridge, and it is set ONLY on
    // srbev's "Yes" click, never on "No", direct visits, or organic traffic.
    // Honor it once: mark this session verified, let dependents (e.g. the wheel)
    // proceed, and strip the flag from the URL so it can't be shared as a bypass.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("av") === "srbev") {
        sessionStorage.setItem(STORAGE_KEY, "true");
        window.dispatchEvent(new Event("sunrise:age-verified"));
        params.delete("av");
        const qs = params.toString();
        window.history.replaceState(
          {},
          "",
          window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
        );
        return; // already verified via srbev — stay hidden, never show the gate
      }
    } catch {
      /* URL/sessionStorage unavailable — fall through to the normal gate */
    }
    try {
      const verified = sessionStorage.getItem(STORAGE_KEY) === "true";
      if (!verified) setState("question");
    } catch {
      setState("question");
    }
  }, []);

  // Body scroll lock while gate is visible. Effect re-runs when state
  // changes; cleanup restores the previous overflow on unmount or hide.
  useEffect(() => {
    if (state === "hidden") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  // Wordmark renderer — same pattern used in SiteHeader/SiteFooter. base *
  // 0.95 sizes the wordmark larger than the header (0.69) but smaller than
  // a hero hit. Repaints on resize and on document.fonts.ready (Montserrat
  // metrics affect glyph kerning inside the wordmark SVG).
  useEffect(() => {
    if (state === "hidden") return;
    const paint = () => {
      const base = getBasePx();
      if (wmRef.current) {
        wmRef.current.innerHTML = renderWordmark(base * 0.95, "gradient");
      }
    };
    paint();
    if (document.fonts) document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [state]);

  const handleYes = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // sessionStorage unavailable — silently proceed. Gate will reappear
      // on next mount, which is acceptable degradation.
    }
    setState("hidden");
    // Notify downstream popups (SpinWheel) that the gate has been cleared
    // so they can mount immediately rather than polling sessionStorage.
    window.dispatchEvent(new Event("sunrise:age-verified"));
    track("age_gate_pass");
  };

  const handleNo = () => setState("refused");

  if (state === "hidden") return null;

  return (
    <div
      className="age-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-heading"
    >
      <div className="age-gate-backdrop" aria-hidden="true" />
      <div className="age-gate-card">
        <div className="age-gate-wordmark" ref={wmRef} aria-hidden="true" />

        {state === "question" ? (
          <>
            <h2 id="age-gate-heading" className="age-gate-heading">
              Are you 21 or older?
            </h2>
            <div className="age-gate-actions">
              <button
                type="button"
                className="age-gate-btn age-gate-btn-primary"
                onClick={handleYes}
                autoFocus
              >
                Yes, I'm 21+
              </button>
              <button
                type="button"
                className="age-gate-btn age-gate-btn-secondary age-gate-btn-no-arrow"
                onClick={handleNo}
              >
                No
              </button>
            </div>
          </>
        ) : (
          <h2 id="age-gate-heading" className="age-gate-heading age-gate-heading-refused">
            Sorry, you must be 21+ to view this site.
          </h2>
        )}

        <div className="age-gate-divider" aria-hidden="true" />
        <p className="age-gate-disclosure">
          SUNRISE&trade; products contain hemp-derived Delta-9 THC. Must be 21+
          to purchase. Consume responsibly.
        </p>
      </div>
    </div>
  );
}