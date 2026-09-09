// Minimal dataLayer push helper for GTM event tracking.
// - SSR-safe: no-ops when there is no window (these files server-render).
// - Domain-scoped: only fires on production hosts (savorsunrise.com / srbev.com),
//   never on Lovable preview/dev hosts or localhost, to avoid polluting the dataset.
// - Never throws; no dependencies. Pushes { event, ...data } to window.dataLayer;
//   GTM tag/trigger config (GA4 + Meta mapping) is handled separately in the GTM dashboard.
export function track(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const h = window.location.hostname;
  const allowed =
    /(^|\.)savorsunrise\.com$/.test(h) || /(^|\.)srbev\.com$/.test(h);
  if (!allowed) return;
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ event, ...data });
}
