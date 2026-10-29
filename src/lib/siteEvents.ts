// One call for every site-behavior event: GTM dataLayer (GA4/Meta mapping in
// the GTM dashboard) + Klaviyo (identified browsers only).
//
// EVENT CATALOG (Klaviyo metric → dataLayer event; every sr_* name is set
// explicitly here, never derived):
//   Viewed Product        → (GA4 view_item, pushed by the PDP)
//   Added to Cart         → (GA4 add_to_cart, pushed by cartStore)
//   Removed from Cart     → (GA4 remove_from_cart, pushed by cartStore)
//   Started Checkout      → (GA4 begin_checkout, pushed by cartStore)
//   Deal Progress         → sr_deal_progress
//   Deal Unlocked         → sr_deal_unlocked
//   Reached Free Shipping → sr_free_shipping
//   Wheel Shown           → sr_wheel_shown        (Klaviyo copy queued until identified)
//   Wheel Spun            → sr_wheel_spun         (Klaviyo copy queued until identified)
//   Wheel Closed          → sr_wheel_closed
//   Wheel Shop Now        → sr_wheel_shop_now
//   Code Copied           → sr_code_copied
//   Active on Site        → (Klaviyo only; once per browser session, queued)
//   Claimed Deal          → unchanged, still logged server-side on claim
//
// dataLayer copies never carry CheckoutURL (it contains the cart's key).
// Non-critical events are deferred off the tap (INP); pass {sync:true} for
// the ones that must leave before navigation (Started Checkout, Shop Now).
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
  /** Klaviyo $value */
  value?: number;
  /** Queue for this session if the browser is not identified yet. */
  queue?: boolean;
  /** Send right now instead of after the current task (default: deferred). */
  sync?: boolean;
  /** Deterministic de-dupe key → Klaviyo unique_id (e.g. "cartId|code|have"). */
  dedupeKey?: string;
};

export const DL_NAMES: Record<string, string> = {
  "Deal Progress": "sr_deal_progress",
  "Deal Unlocked": "sr_deal_unlocked",
  "Reached Free Shipping": "sr_free_shipping",
  "Wheel Shown": "sr_wheel_shown",
  "Wheel Spun": "sr_wheel_spun",
  "Wheel Closed": "sr_wheel_closed",
  "Wheel Shop Now": "sr_wheel_shop_now",
  "Code Copied": "sr_code_copied",
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
  const time = new Date().toISOString();
  const page = `${window.location.host.replace(/^www\./, "")}${window.location.pathname}`;
  const run = () => {
    try {
      const props = { ...properties, page };
      const dl = DL_NAMES[metric];
      if (dl) {
        const { CheckoutURL: _omit, ...dlProps } = props as Record<string, unknown>;
        track(dl, dlProps);
      }
      const ev: KlaviyoEvent = {
        metric,
        properties: props,
        value: opts.value,
        time,
        uniqueId: opts.dedupeKey ? `${metric}|${opts.dedupeKey}`.slice(0, 250) : uid(),
      };
      if (getIdentity()) sendKlaviyoEvent(ev);
      else if (opts.queue && isProductionHost()) writePending([...readPending(), ev]);
    } catch {
      /* tracking must never break the page */
    }
  };
  if (opts.sync) run();
  else window.setTimeout(run, 0);
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
  siteEvent("Active on Site", { landing_url: window.location.href.slice(0, 500) }, { queue: true });
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
