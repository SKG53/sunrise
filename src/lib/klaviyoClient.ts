// Scriptless Klaviyo client events (Added to Cart brief v2, extended).
// - No klaviyo.js. One keepalive POST per event to Klaviyo's public client API
//   with the PUBLIC site ID (safe in the browser). Never the private key.
// - Production hosts only (same guard as track.ts); SSR-safe; never throws.
// - Identified browsers only (lib/identity: email preferred, else `_kx`).
//   Anonymous events are NOT sent; siteEvents.ts can queue them for this
//   session and flush them (with their original timestamps) once the visitor
//   identifies, e.g. Wheel Shown → Wheel Spun → claim.

import { getIdentity } from "./identity";

const COMPANY_ID = "WFshgx";
const REVISION = "2026-04-15"; // same revision as klaviyo.server.ts
const ENDPOINT = `https://a.klaviyo.com/client/events?company_id=${COMPANY_ID}`;

export function isProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return /(^|\.)savorsunrise\.com$/.test(h) || /(^|\.)srbev\.com$/.test(h);
}

export type KlaviyoEvent = {
  metric: string;
  properties: Record<string, unknown>;
  value?: number;
  time?: string; // ISO; defaults to now on Klaviyo's side
  uniqueId?: string; // Klaviyo de-dupes on this
};

/** Sends one event for the identified browser. Returns false if not sent. */
export function sendKlaviyoEvent(ev: KlaviyoEvent): boolean {
  if (!isProductionHost()) return false;
  const id = getIdentity();
  if (!id) return false;
  const profile: Record<string, string> = id.email ? { email: id.email } : { _kx: id.kx as string };
  const attributes: Record<string, unknown> = {
    properties: ev.properties,
    metric: { data: { type: "metric", attributes: { name: ev.metric } } },
    profile: { data: { type: "profile", attributes: profile } },
  };
  if (typeof ev.value === "number" && Number.isFinite(ev.value)) attributes.value = Number(ev.value.toFixed(2));
  if (ev.time) attributes.time = ev.time;
  if (ev.uniqueId) attributes.unique_id = ev.uniqueId;
  try {
    fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", revision: REVISION },
      body: JSON.stringify({ data: { type: "event", attributes } }),
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** Brief v2 name kept for compatibility. */
export function trackKlaviyo(event: string, properties: Record<string, unknown>, value?: number): void {
  sendKlaviyoEvent({ metric: event, properties, value });
}
