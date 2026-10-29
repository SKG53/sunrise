// One call for every site-behavior event: GTM dataLayer (GA4/Meta mapping in
// the GTM dashboard) + Klaviyo (identified browsers only).
//
// EVENT CATALOG (Klaviyo metric name → dataLayer event name):
//   Viewed Product        → (GA4 view_item, pushed by the PDP as before)
//   Added to Cart         → (GA4 add_to_cart, pushed by cartStore as before)
//   Removed from Cart     → (GA4 remove_from_cart, pushed by cartStore)
//   Started Checkout      → (GA4 begin_checkout, pushed by cartStore)
//   Deal Progress         → sr_deal_progress
//   Deal Unlocked         → sr_deal_unlocked
//   Reached Free Shipping → sr_free_shipping
//   Wheel Shown           → sr_wheel_shown        (queued until identified)
//   Wheel Spun            → sr_wheel_spun         (queued until identified)
//   Wheel Closed          → sr_wheel_closed
//   Wheel Shop Now        → sr_wheel_shop_now
//   Code Copied           → sr_code_copied
//   Active on Site        → (Klaviyo only; once per browser session, queued)
//   Claimed Deal          → unchanged, still logged server-side on claim
//
// NOTE: Klaviyo's Shopify integration already records "Checkout Started" and
// "Placed Order". "Started Checkout" here is the SITE's own event (fires the
// moment the shopper leaves the cart for Shopify), so the names differ on
// purpose. Flows that exist today keep using the Shopify metrics.

import { track } from "./track";
import { sendKlaviyoEvent, isProductionHost, type KlaviyoEvent } from "./klaviyoClient";
import { getIdentity, subscribeIdentity } from "./identity";

const PENDING_KEY = "sunrise:kl-pending";
const ACTIVE_KEY = "sunrise:kl-active";
const MAX_PENDING = 25;

type Opts = {
  /** dataLayer event name; false = Klaviyo only (GA push handled elsewhere). */
  dl?: string | false;
  /** Klaviyo $value */
  value?: number;
  /** Queue for this session if the browser is not identified yet. */
  queue?: boolean;
};

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function readPending(): KlaviyoEvent[] {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writePending(list: KlaviyoEvent[]) {
  try {
    if (list.length) sessionStorage.setItem(PENDING_KEY, JSON.stringify(list.slice(-MAX_PENDING)));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* private mode */
  }
}

export function siteEvent(metric: string, properties: Record<string, unknown> = {}, opts: Opts = {}): void {
  if (typeof window === "undefined") return;
  try {
    const props = {
      ...properties,
      page: `${window.location.host.replace(/^www\./, "")}${window.location.pathname}`,
    };
    if (opts.dl !== false) track(opts.dl ?? `sr_${metric.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, props);
    const ev: KlaviyoEvent = { metric, properties: props, value: opts.value, time: new Date().toISOString(), uniqueId: uid() };
    if (getIdentity()) sendKlaviyoEvent(ev);
    else if (opts.queue && isProductionHost()) writePending([...readPending(), ev]);
  } catch {
    /* tracking must never break the page */
  }
}

/** Sends anything queued this session. Called automatically on identification. */
export function flushPendingEvents(): void {
  if (!getIdentity()) return;
  const list = readPending();
  if (!list.length) return;
  writePending([]);
  list.forEach((ev) => sendKlaviyoEvent(ev));
}

/** "Active on Site": once per browser session; queued if not identified yet. */
export function markActiveOnSite(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(ACTIVE_KEY) === "1") return;
    sessionStorage.setItem(ACTIVE_KEY, "1");
  } catch {
    return; // no session storage → skip rather than fire on every page
  }
  siteEvent("Active on Site", { landing_url: window.location.href.slice(0, 500) }, { dl: false, queue: true });
}

let wired = false;
/** Call once on load (__root): flush the queue whenever identity is set. */
export function initSiteEvents(): void {
  if (wired || typeof window === "undefined") return;
  wired = true;
  subscribeIdentity(() => flushPendingEvents());
  flushPendingEvents();
  markActiveOnSite();
}
