// BUILD YOUR BOX — main-site port (site pass 1, Oct 28 2026) of the lander
// prototype (sunrise-lander components/BuildYourBox.tsx @ b1e3421, approved
// for layout/flow/behavior on /neverpull/buy1get2 and /neverpull/buy3get2).
//
// One reusable page body for every "buy X, get Y" / mix-and-match deal. The
// route (routes/box.$deal.tsx) passes the box size, copy, code and which packs
// can be free; everything else is shared.
//
// Flow: tap grid cards to fill the paid slots → tap a free slot to pick its
// flavor → Continue → email ("Unlock My Box"; SKIPPED when the browser is
// already known) → reveal → "Continue to Checkout" puts every pack in the
// site cart (merged with anything already there), the code is applied by the
// cart, and the shopper goes to Shopify in the same tab with the email set.
// "Add to Cart & Keep Shopping" does the same without leaving.
//
// Standing-rule table from the prototype, as built here:
//   Potency lockups   → main lib/sunrise-components ("10 MG THC")
//   Cannabinoid strip → main "+CBG" / "+CBN" / "+THCV"
//   Can images        → public/images/cans/card/<slug>.webp (card-sized
//                       derivatives of the main renders, ~25 KB each)
//   Header / footer   → main SiteHeader / SiteFooter (full legal disclaimer)
//   Announcement bar  → main's, as-is
//   Writes            → REAL: newsletter gate, then spin-wheel-hubspot,
//                       spin-wheel-klaviyo (Claimed Deal), deal-claim; never
//                       block the reveal. popup_type "build_box".
//   Popup suppression → SpinWheel onNoWheelPath() includes /box/*
//   Checkout email    → set on the Shopify cart by the cart store
//   Codes             → real Shopify codes from lib/deals.ts
//   Box contents      → built client-side; Shopify still validates the code
//                       against the cart at checkout, so a tampered box can't
//                       get more than the discount allows.
//
// SITE PASS 2 (Oct 29): one cart, many views — the box reads the SAME cart as
// the cart icon (stores/cartStore.ts). Free-pick prices count packs already
// in the cart; older cart items are listed on the reveal; a box that's
// already in the cart can't be added again (record + busy guard re-enabled on
// pageshow, never on a timer); a known browser (saved email OR a Klaviyo
// click) skips the email step; claim writes only fire for a real form submit
// or the first claim of this code in this browser; "% off N or more" deals use
// the same page with freeSlots = 0 and `percent`.
//
// "Any 4-pack free" deals: Shopify makes the CHEAPEST qualifying pack free.
// To keep the page honest, the free picker only offers packs priced at or
// below the cheapest paid pack, and drops a free pick that stops qualifying.

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { storefrontApiRequest } from "../lib/shopify";
import { readUtms } from "../lib/utms";
import { isKnownBrowser, knownEmail, setIdentityEmail } from "../lib/identity";
import { addToWallet, getWalletEntry } from "../lib/dealWallet";
import { siteEvent } from "../lib/siteEvents";
import { FREE_SHIP_THRESHOLD, FREE_SHIP_LABEL, cheapestPaidPrice, dealByCode } from "../lib/deals";
import { useCartStore, dealLines, type AddInput } from "../stores/cartStore";
import {
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  getBasePx,
} from "../lib/sunrise-components";
import {
  FREE_10MG,
  LIVE_FOUR_PACKS,
  cardCanSrc,
  packBySlug,
  type Cannabinoid,
  type FourPack,
  type Tier,
} from "../lib/liveFourPacks";
import "./FreeCanLanding.css"; // shared .tfc-* styles (free-can landing pages)
import "./BuildYourBox.css";

// ── CONFIG ───────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POPUP_TYPE = "build_box";
const MOBILE_MQ = "(max-width: 768px)";

export type BuildYourBoxProps = {
  paidSlots: number;
  freeSlots: number;
  headline: string;
  subline: string;
  code: string;
  storageKey: string;
  logTag: string;
  /** Which packs can be free: the three 10 mg 4-packs, or any live 4-pack. */
  freePool: "10mg" | "any";
  /** "% off N or more" boxes (freeSlots = 0): the percent, for savings copy. */
  percent?: number;
};

type Step = "build" | "email" | "reveal";
type Slots = (string | null)[];

const TIERS: { tier: Tier; color: string }[] = [
  { tier: 10, color: "#CC1F39" },
  { tier: 30, color: "#0A6034" },
  { tier: 60, color: "#2E1E3D" },
];

// fysInk luminance rule (same as tryfreecan): on light flavor colors flip
// flavor-colored ink on cream to near-black.
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const inkFor = (hex: string) => (luminance(hex) > 0.3 ? "#1A1A1A" : hex);
// Text placed ON a flavor-color field: cream on dark colors, near-black on light.
const onColor = (hex: string) => (luminance(hex) > 0.3 ? "#1A1A1A" : "#FEFBE0");

const tierLockup = (tier: Tier, base: number, color: string) =>
  tier === 10
    ? render10mgLockup(base, color)
    : tier === 30
      ? render30mgLockup(base, color)
      : render60mgLockup(base, color);
const cbLockup = (cb: Cannabinoid, base: number, color: string) =>
  cb === "CBG"
    ? renderCBGLockup(base, color)
    : cb === "CBN"
      ? renderCBNLockup(base, color)
      : renderTHCVLockup(base, color);

const money = (n: number) => `$${n.toFixed(2)}`;
// Cart line → can art. Shopify handles drop the cannabinoid suffix the site
// slugs carry (60mg-blackberry ↔ 60mg-blackberry-cbn). Null for non-4-pack
// products (5 mg, retired flavors): those fall back to the Shopify image.
const packForHandle = (handle: string): FourPack | null =>
  LIVE_FOUR_PACKS.find((p) => p.slug === handle || p.slug.replace(/-(cbn|cbg|thcv)$/, "") === handle) ?? null;
const round2 = (n: number) => Math.round(n * 100) / 100;

// Box record (sessionStorage). email is null for a browser known only by a
// Klaviyo click; addedToCart = the cart id the box was added to (review 1.4).
type Saved = { paid: string[]; free: string[]; claimed: true; email: string | null; addedToCart?: string };
function readSaved(key: string, paidSlots: number, freeSlots: number): Saved | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Saved>;
    const ok =
      v.claimed === true &&
      Array.isArray(v.paid) &&
      v.paid.length === paidSlots &&
      v.paid.every((s) => !!packBySlug(s)) &&
      Array.isArray(v.free) &&
      v.free.length === freeSlots &&
      v.free.every((s) => !!packBySlug(s)) &&
      (typeof v.email === "string" || v.email === null);
    if (ok) return v as Saved;
  } catch {
    /* private browsing / bad JSON — start fresh */
  }
  return null;
}

// Fireworks — same burst as tryfreecan (main's Spin & Save), .tfc-* classes.
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
        <span
          key={i}
          className="tfc-burst"
          style={{ top: b.top, left: b.left, color: b.color, animationDelay: b.delay }}
        >
          {Array.from({ length: 12 }).map((_, j) => (
            <span
              key={j}
              className="tfc-particle"
              style={{ "--rotate": `${j * 30}deg` } as CSSProperties}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

function Html({ html, className }: { html: string; className?: string }) {
  return (
    <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function BuildYourBox({
  paidSlots,
  freeSlots,
  headline,
  subline,
  code,
  storageKey,
  logTag,
  freePool,
  percent,
}: BuildYourBoxProps) {
  const addItems = useCartStore((st) => st.addItems);
  const cartCheckout = useCartStore((st) => st.checkout);
  const openCart = useCartStore((st) => st.openCart);
  const cartItems = useCartStore((st) => st.items);
  const cartId = useCartStore((st) => st.cartId);
  const rule = dealByCode(code);
  const boxRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const stepTopRef = useRef<HTMLElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const freeSlotRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const paidSlotRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const flashTimer = useRef<number | undefined>(undefined);
  const fullTimer = useRef<number | undefined>(undefined);

  const [paid, setPaid] = useState<Slots>(() => Array(paidSlots).fill(null));
  const [free, setFree] = useState<Slots>(() => Array(freeSlots).fill(null));
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [step, setStep] = useState<Step>("build");
  const [picker, setPicker] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [vw, setVw] = useState(1280);
  const [basePx, setBasePx] = useState(50);
  const [stickyTop, setStickyTop] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [fullPulse, setFullPulse] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [company, setCompany] = useState(""); // honeypot (review 4.2f)
  const [addedTo, setAddedTo] = useState<string | null>(null);

  const priceOf = (p: FourPack) => prices[p.variantId] ?? p.fallbackPrice;
  const paidPacks = paid.map((s) => packBySlug(s));
  const freePacks = free.map((s) => packBySlug(s));
  const paidSubtotal = round2(paidPacks.reduce((sum, p) => sum + (p ? priceOf(p) : 0), 0));
  // Free choices: 10 mg pool, or (any-pack deals) packs priced at or below the
  // cheapest paid pack — the one Shopify will actually make free. Counts the
  // WHOLE cart: paid 4-packs already in it count too (review 1.5).
  const boxMin = paidPacks.reduce((m, p) => (p ? Math.min(m, priceOf(p)) : m), Infinity);
  const cartMin = rule?.kind === "bxgy" ? cheapestPaidPrice(dealLines(cartItems), rule.buyScope) : Infinity;
  const minPaid = Math.min(boxMin, cartMin);
  const freeOptions: FourPack[] =
    freePool === "10mg" ? FREE_10MG : LIVE_FOUR_PACKS.filter((p) => priceOf(p) <= minPaid + 0.001);
  const paidFull = paid.every((s) => s !== null);
  const boxFull = paidFull && free.every((s) => s !== null);
  const filledCount = paid.filter(Boolean).length + free.filter(Boolean).length;
  const totalSlots = paidSlots + freeSlots;
  // "% off" boxes: shipping counts the price after the discount (Shopify's
  // free-shipping rate is after discounts — verified).
  const pctSavings = percent && paidFull ? round2((paidSubtotal * percent) / 100) : 0;
  const shipBasis = round2(paidSubtotal - pctSavings);
  const shipUnlocked = shipBasis >= FREE_SHIP_THRESHOLD;
  const shipFill = Math.min(shipBasis / FREE_SHIP_THRESHOLD, 1);
  const shipText = shipUnlocked
    ? "Free shipping unlocked\u00a0✓"
    : `You're ${money(round2(FREE_SHIP_LABEL - shipBasis))} away from free shipping`;
  // Box already in THIS cart? Then the reveal only offers checkout / view cart.
  const inCart = !!addedTo && addedTo === cartId;
  // Older items already in the cart (shown on the reveal before adding).
  const otherItems = inCart ? [] : cartItems;
  const paidLabel = paidSlots === 1 ? "Your 4-pack" : "Your 4-packs";
  const boxTitle = headline;

  // Restore a claimed box straight to the reveal (no fireworks). The wheel is
  // already kept off /box/* by SpinWheel's path check, so this page no longer
  // marks the wheel "seen" for the whole session (review 4.2g).
  useEffect(() => {
    const saved = readSaved(storageKey, paidSlots, freeSlots);
    if (saved) {
      setPaid(saved.paid);
      setFree(saved.free);
      setEmail(saved.email ?? "");
      setAddedTo(saved.addedToCart ?? null);
      setStep("reveal");
    }
  }, [storageKey, paidSlots, freeSlots]);

  // Back from Shopify (back/forward cache) → buttons usable again.
  useEffect(() => {
    const onShow = () => {
      setCheckoutBusy(false);
      setUnlocking(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Live 4-pack prices (fallback prices stay if this fails).
  useEffect(() => {
    let cancelled = false;
    type NodesData = { nodes: ({ id: string; price?: { amount: string } } | null)[] };
    storefrontApiRequest<NodesData>(
      `query BoxPrices($ids: [ID!]!) { nodes(ids: $ids) { ... on ProductVariant { id price { amount } } } }`,
      { ids: LIVE_FOUR_PACKS.map((p) => p.variantId) },
    )
      .then((res) => {
        if (cancelled) return;
        const next: Record<string, number> = {};
        res?.data?.nodes?.forEach((n) => {
          const amt = n?.price ? parseFloat(n.price.amount) : NaN;
          if (n && Number.isFinite(amt) && amt > 0) next[n.id] = amt;
        });
        setPrices(next);
      })
      .catch((err) => console.warn(`[${logTag}] price fetch failed; using fallback prices`, err));
    return () => {
      cancelled = true;
    };
  }, [logTag]);

  // Viewport: mobile breakpoint, lockup sizes, and the sticky offset (the box
  // pins directly under the sticky announcement bar + header).
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => {
      setIsMobile(mq.matches);
      setVw(window.innerWidth);
      setBasePx(getBasePx());
      const bottomOf = (sel: string) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) return 0;
        const cs = getComputedStyle(el);
        if (cs.position !== "sticky" && cs.position !== "fixed") return 0;
        return (parseFloat(cs.top) || 0) + el.offsetHeight;
      };
      setStickyTop(Math.max(bottomOf(".announcement-bar"), bottomOf(".site-header")));
    };
    sync();
    if (document.fonts) document.fonts.ready.then(sync);
    mq.addEventListener("change", sync);
    window.addEventListener("resize", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) setExpanded(false);
  }, [isMobile]);

  // Mobile: scrolling the grid collapses the expanded box (not while the picker is open).
  useEffect(() => {
    if (!isMobile || !expanded || picker !== null) return;
    let y0: number | null = null;
    const arm = window.setTimeout(() => {
      y0 = window.scrollY;
    }, 250);
    const onScroll = () => {
      if (y0 !== null && Math.abs(window.scrollY - y0) > 48) setExpanded(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("scroll", onScroll);
    };
  }, [isMobile, expanded, picker]);

  // Picker: focus the first option, trap Tab, Esc closes, outside click closes.
  useEffect(() => {
    if (picker === null) return;
    const root = pickerRef.current;
    const slotIndex = picker;
    const id = window.requestAnimationFrame(() =>
      root?.querySelector<HTMLButtonElement>("button[data-pick]")?.focus(),
    );
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!root) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closePicker(slotIndex);
      } else if (e.key === "Tab") {
        const f = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!root.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (root?.contains(t) || freeSlotRefs.current[slotIndex]?.contains(t)) return;
      closePicker(slotIndex, false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [picker]);

  const reduceMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const flashSlot = (key: string) => {
    window.clearTimeout(flashTimer.current);
    setFlash(key);
    flashTimer.current = window.setTimeout(() => setFlash(null), 900);
  };

  const pulseFull = () => {
    window.clearTimeout(fullTimer.current);
    setFullPulse(true);
    fullTimer.current = window.setTimeout(() => setFullPulse(false), 2600);
  };

  const closePicker = (slotIndex: number, refocus = true) => {
    setPicker(null);
    if (refocus) window.requestAnimationFrame(() => freeSlotRefs.current[slotIndex]?.focus());
  };

  const scrollToGrid = () => {
    const grid = gridRef.current;
    if (!grid) return;
    if (isMobile) setExpanded(false);
    window.requestAnimationFrame(() => {
      const boxH = boxRef.current?.offsetHeight ?? 0;
      const top = grid.getBoundingClientRect().top + window.scrollY - stickyTop - boxH - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion() ? "auto" : "smooth" });
    });
  };

  const remainingText = (nextPaid: Slots, nextFree: Slots) => {
    const left =
      nextPaid.filter((s) => s === null).length + nextFree.filter((s) => s === null).length;
    return left === 0
      ? "Your box is full. Continue when you're ready."
      : `${left} ${left === 1 ? "slot" : "slots"} left.`;
  };

  const addPaid = (p: FourPack) => {
    if (step !== "build") return;
    const i = paid.indexOf(null);
    if (i < 0) {
      setAnnounce("Your box is full. Tap × to swap a flavor.");
      pulseFull();
      return;
    }
    const next = [...paid];
    next[i] = p.slug;
    setPaid(next);
    setShowHint(false);
    flashSlot(`p${i}`);
    const nowFull = next.every((s) => s !== null);
    setAnnounce(
      `${p.flavor} 4-pack added to your box. ${nowFull && paidSlots > 0 ? "Your 4-packs are all in. " : ""}${remainingText(next, free)}`,
    );
  };

  const removePaid = (i: number) => {
    const p = packBySlug(paid[i]);
    const next = [...paid];
    next[i] = null;
    setPaid(next);
    setAnnounce(`${p?.flavor ?? "4-pack"} removed. ${remainingText(next, free)}`);
    window.requestAnimationFrame(() => paidSlotRefs.current[i]?.focus());
  };

  const pickFree = (i: number, p: FourPack) => {
    const next = [...free];
    next[i] = p.slug;
    setFree(next);
    setShowHint(false);
    flashSlot(`f${i}`);
    setAnnounce(`${p.flavor} added as free 4-pack ${i + 1}. ${remainingText(paid, next)}`);
    closePicker(i);
  };

  const removeFree = (i: number) => {
    const p = packBySlug(free[i]);
    const next = [...free];
    next[i] = null;
    setFree(next);
    setAnnounce(`Free ${p?.flavor ?? "4-pack"} removed. ${remainingText(paid, next)}`);
    window.requestAnimationFrame(() => freeSlotRefs.current[i]?.focus());
  };

  // Any-pack deals: a free pick priced above the (new) cheapest paid pack no
  // longer matches what Shopify will discount → empty that free slot.
  useEffect(() => {
    if (freePool !== "any" || step !== "build") return;
    setFree((cur) => {
      const cleared: string[] = [];
      const next = cur.map((sl) => {
        const p = packBySlug(sl);
        if (p && priceOf(p) > minPaid + 0.001) {
          cleared.push(p.flavor);
          return null;
        }
        return sl;
      });
      if (!cleared.length) return cur;
      // Never silent: announce why the free pick was cleared.
      setAnnounce(
        `Your free ${cleared.join(", ")} was cleared: the free 4-pack has to be your lowest-priced pack. Pick it again.`,
      );
      setShowHint(true);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freePool, minPaid]);

  const scrollToStep = (focusEmail: boolean) =>
    window.setTimeout(() => {
      stepTopRef.current?.scrollIntoView({
        behavior: reduceMotion() ? "auto" : "smooth",
        block: "start",
      });
      if (focusEmail) emailRef.current?.focus({ preventScroll: true });
    }, 30);

  const onContinue = () => {
    if (!boxFull) {
      setShowHint(true);
      setAnnounce("Fill your box to continue.");
      if (isMobile) setExpanded(true);
      return;
    }
    setExpanded(false);
    setPicker(null);
    // Known browser (saved email OR a Klaviyo email click): no email step.
    if (isKnownBrowser()) {
      unlockWith(knownEmail(), false);
      return;
    }
    setStep("email");
    scrollToStep(true);
  };

  // Records the claim (never blocks the reveal) and reveals the box.
  //  - Form submit (cold visitor): newsletter gate, then HubSpot + Klaviyo
  //    (Claimed Deal; subscribes) + deal_claims, all with popup_type build_box.
  //  - Known browser: no Klaviyo write (it subscribes). deal-claim + HubSpot
  //    only when this is the FIRST claim of this code in this browser; the
  //    main path (wheel → Shop Now → box) already wrote both (review2 1.7).
  //  - Klaviyo-click-only browser (no email): nothing to write.
  const unlockWith = async (value: string | null, viaForm: boolean) => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      const capture_page = `${window.location.host.replace(/^www\./, "")}${window.location.pathname}`;
      if (viaForm && value) {
        try {
          const res = await fetch("/api/public/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: value, source: "build-box" }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setEmailError(data?.error || "Something went wrong. Please try again.");
            return;
          }
        } catch {
          setEmailError("Something went wrong. Please try again.");
          return;
        }
      }
      const firstClaimHere = !getWalletEntry(code);
      if (value && (viaForm || firstClaimHere)) {
        const claim = {
          email: value,
          popup_type: POPUP_TYPE,
          capture_page,
          deal_code: code,
          deals_offered: code,
          deal_date: new Date().toISOString().slice(0, 10),
          ...readUtms(),
        };
        const fire = (url: string) =>
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(claim),
          }).catch(() => {});
        fire("/api/public/spin-wheel-hubspot");
        fire("/api/public/deal-claim");
        if (viaForm) fire("/api/public/spin-wheel-klaviyo"); // Claimed Deal (Spin & Save flow)
      }
      if (value) setIdentityEmail(value);
      addToWallet(code, "box", { box: true });
      try {
        const saved: Saved = { paid: paid as string[], free: free as string[], claimed: true, email: value };
        sessionStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        /* harmless */
      }
      setEmail(value ?? "");
      setCelebrate(!reduceMotion());
      setStep("reveal");
      scrollToStep(false);
    } finally {
      setUnlocking(false);
    }
  };

  const onUnlock = () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || value.length > 320) {
      setEmailError("Enter a valid email address.");
      emailRef.current?.focus();
      return;
    }
    setEmailError("");
    // Honeypot: people never fill it. Reveal locally, write nothing.
    if (company.trim()) {
      unlockWith(null, false);
      return;
    }
    unlockWith(value, true);
  };

  const copyCode = async () => {
    try {
      // Logged on the tap itself, even if the browser blocks the clipboard.
      siteEvent("Code Copied", { code, source: "build_box" });
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — code is visible on screen anyway */
    }
  };

  // Box → the site cart (merged with anything already there). Re-activates
  // this box's code first (another deal may have become active since the
  // unlock), records that the box is in the cart (no double add), and the cart
  // applies the code. Checkout sets the email on the Shopify cart and
  // redirects in the same tab.
  const boxToCart = async (open: boolean): Promise<boolean> => {
    addToWallet(code, "box", { box: true });
    const qty = new Map<string, { p: FourPack; n: number }>();
    [...paidPacks, ...freePacks].forEach((p) => {
      if (p) qty.set(p.variantId, { p, n: (qty.get(p.variantId)?.n ?? 0) + 1 });
    });
    const list: AddInput[] = Array.from(qty.values(), ({ p, n }) => ({
      variantId: p.variantId,
      productHandle: p.slug,
      productTitle: `${p.flavor} ${p.tier}mg`,
      variantTitle: "4 PACK",
      imageUrl: null,
      price: { amount: priceOf(p).toFixed(2), currencyCode: "USD" },
      quantity: n,
      selectedOptions: [],
    }));
    const ok = await addItems(list, { open });
    const id = useCartStore.getState().cartId;
    if (ok && id) {
      setAddedTo(id);
      try {
        const saved: Saved = { paid: paid as string[], free: free as string[], claimed: true, email: email || null, addedToCart: id };
        sessionStorage.setItem(storageKey, JSON.stringify(saved));
      } catch {
        /* harmless */
      }
    }
    return ok;
  };

  // Primary reveal action:
  //  - box already in the cart → checkout (no re-add)
  //  - cart already had other items → add, then OPEN THE CART to review
  //  - empty cart → add and go straight to checkout
  const onPrimary = async () => {
    if (checkoutBusy || !boxFull) return;
    setCheckoutBusy(true);
    setCheckoutError("");
    try {
      if (inCart) {
        await cartCheckout(email ? { email } : undefined);
      } else if (otherItems.length > 0) {
        if (!(await boxToCart(true))) throw new Error("add failed");
        setCheckoutBusy(false);
        return;
      } else {
        if (!(await boxToCart(false))) throw new Error("add failed");
        await cartCheckout(email ? { email } : undefined);
      }
      // Still here = checkout didn't navigate (the cart shows why).
      if (!useCartStore.getState().isCheckingOut) setCheckoutBusy(false);
    } catch (err) {
      console.error(`[${logTag}] checkout failed`, err);
      setCheckoutError("Something went wrong. Please try again.");
      setCheckoutBusy(false);
    }
  };

  const onSecondary = async () => {
    if (checkoutBusy || !boxFull) return;
    if (inCart) {
      openCart();
      return;
    }
    setCheckoutBusy(true);
    setCheckoutError("");
    const ok = await boxToCart(true);
    setCheckoutBusy(false);
    if (!ok) setCheckoutError("Something went wrong. Please try again.");
  };

  const primaryLabel = inCart ? "Checkout" : otherItems.length > 0 ? "Add to Cart" : "Continue to Checkout";
  const secondaryLabel = inCart ? "View Cart" : "Add to Cart & Keep Shopping";

  // ── RENDER HELPERS ──────────────────────────────────────────────────────
  const editable = step === "build";
  const slotLockupBase = isMobile ? 13 : 15;

  const renderPaidSlot = (i: number) => {
    const p = paidPacks[i];
    const n = i + 1;
    if (!p) {
      return (
        <button
          key={`p${i}`}
          ref={(el) => {
            paidSlotRefs.current[i] = el;
          }}
          type="button"
          className={`byb-slot is-empty${flash === `p${i}` ? " is-flash" : ""}`}
          aria-label={`Empty paid slot ${n} — add a 4-pack`}
          onClick={scrollToGrid}
          disabled={!editable}
        >
          <span className="byb-slot-plus" aria-hidden="true">
            +
          </span>
          <span className="byb-slot-cta">Add your 4‑pack</span>
        </button>
      );
    }
    return (
      <div
        key={`p${i}`}
        className={`byb-slot is-filled${flash === `p${i}` ? " is-flash" : ""}`}
        style={{ "--slot-color": p.color, "--slot-on": onColor(p.color) } as CSSProperties}
      >
        <div className="byb-slot-art">
          <Html
            className="byb-slot-tier"
            html={tierLockup(p.tier, slotLockupBase, onColor(p.color))}
          />
          <img src={cardCanSrc(p.slug)} alt="" width={331} height={900} decoding="async" />
        </div>
        <div className="byb-slot-info">
          <span className="byb-slot-name">{p.flavor}</span>
          <span className="byb-slot-price">{money(priceOf(p))}</span>
        </div>
        {editable && (
          <button
            ref={(el) => {
              paidSlotRefs.current[i] = el;
            }}
            type="button"
            className="byb-slot-x"
            aria-label={`Paid slot ${n}: ${p.flavor} — remove`}
            onClick={() => removePaid(i)}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  };

  const renderFreeSlot = (i: number) => {
    const p = freePacks[i];
    const n = i + 1;
    if (!p) {
      return (
        <button
          key={`f${i}`}
          ref={(el) => {
            freeSlotRefs.current[i] = el;
          }}
          type="button"
          className={`byb-slot is-empty is-free${flash === `f${i}` ? " is-flash" : ""}${picker === i ? " is-open" : ""}`}
          aria-label={paidFull ? `Empty free slot ${n} — pick a flavor` : `Free slot ${n} — fill your 4-packs first`}
          aria-haspopup="dialog"
          aria-expanded={picker === i}
          onClick={() => setPicker(picker === i ? null : i)}
          disabled={!editable || !paidFull}
        >
          <span className="byb-slot-plus" aria-hidden="true">
            +
          </span>
          <span className="byb-slot-cta">{paidFull ? "Pick a flavor" : "Fill your 4-packs first"}</span>
        </button>
      );
    }
    return (
      <div
        key={`f${i}`}
        className={`byb-slot is-filled is-free${flash === `f${i}` ? " is-flash" : ""}`}
        style={{ "--slot-color": p.color, "--slot-on": onColor(p.color) } as CSSProperties}
      >
        <div className="byb-slot-art">
          <Html
            className="byb-slot-tier"
            html={tierLockup(p.tier, slotLockupBase, onColor(p.color))}
          />
          <img src={cardCanSrc(p.slug)} alt="" width={331} height={900} decoding="async" />
        </div>
        <div className="byb-slot-info">
          <span className="byb-slot-name">{p.flavor}</span>
          <span className="byb-slot-price">
            <s>{money(priceOf(p))}</s> <strong className="byb-free-tag">FREE</strong>
          </span>
        </div>
        {editable && (
          <button
            ref={(el) => {
              freeSlotRefs.current[i] = el;
            }}
            type="button"
            className="byb-slot-x"
            aria-label={`Free slot ${n}: ${p.flavor} — remove`}
            onClick={() => removeFree(i)}
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    );
  };

  const pickerEl = picker !== null && (
    <>
      {isMobile && (
        <div
          className="byb-sheet-backdrop"
          aria-hidden="true"
          onClick={() => closePicker(picker, false)}
        />
      )}
      <div
        ref={pickerRef}
        className={isMobile ? "byb-picker byb-picker--sheet" : "byb-picker byb-picker--pop"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="byb-picker-title"
      >
        <div className="byb-picker-head">
          <h3 id="byb-picker-title" className="byb-picker-title">
            Free 4-pack {picker + 1}: pick a flavor
          </h3>
          <button
            type="button"
            className="byb-picker-close"
            aria-label="Close"
            onClick={() => closePicker(picker)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="byb-picker-options">
          {freeOptions.map((p) => (
            <button
              key={p.slug}
              type="button"
              data-pick
              className="byb-pick"
              style={{ "--slot-color": p.color, "--card-ink": inkFor(p.color) } as CSSProperties}
              aria-label={`${p.flavor}, ${p.descriptor} — free`}
              onClick={() => pickFree(picker, p)}
            >
              <span className="byb-pick-art">
                <img src={cardCanSrc(p.slug)} alt="" width={331} height={900} decoding="async" />
              </span>
              <span className="byb-pick-name">{p.flavor}</span>
              <span className="byb-pick-desc">{p.descriptor}</span>
              <span className="byb-pick-price">
                <s>{money(priceOf(p))}</s> <strong className="byb-free-tag">FREE</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const progress = (
    <div className="byb-progress">
      <div
        className="byb-bar"
        role="progressbar"
        aria-label="Free shipping progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shipFill * 100)}
      >
        <span
          className={`byb-bar-fill${shipUnlocked ? " is-done" : ""}`}
          style={{ width: `${shipFill * 100}%` }}
        />
      </div>
      <p className={`byb-ship-text${shipUnlocked ? " is-done" : ""}`}>{shipText}</p>
    </div>
  );

  // Two copies render on mobile (collapsed row + expanded panel), so each
  // gets its own hint id (review 4.2k).
  const continueBtn = (hintId: string) => (
    <button
      type="button"
      className={`btn btn-primary byb-continue${boxFull ? "" : " is-disabled"}`}
      aria-disabled={!boxFull}
      aria-describedby={!boxFull ? hintId : undefined}
      onClick={onContinue}
      disabled={unlocking}
    >
      Continue
    </button>
  );

  const hint = (hintId: string) =>
    !boxFull && (
      <p id={hintId} className={`byb-hint${showHint ? " is-shown" : ""}`}>
        {freeSlots > 0 && !paidFull ? "Fill your 4-packs, then pick your free one" : "Fill your box to continue"}
      </p>
    );

  const fullNote = editable && paidFull && (
    <p className={`byb-full-note${fullPulse ? " is-pulse" : ""}`}>
      Your box is full — tap × to swap a flavor.
    </p>
  );

  // The full box (desktop always; mobile when expanded or after Continue).
  const fullBox = (
    <div className="byb-box-inner">
      <div className="byb-box-title">{boxTitle}</div>
      <div className="byb-slots">
        <div className="byb-group byb-group--paid" role="group" aria-label={paidLabel}>
          <div className="byb-group-label">{paidLabel}</div>
          <div className="byb-group-row">{paid.map((_, i) => renderPaidSlot(i))}</div>
        </div>
        {freeSlots > 0 && (
          <div className="byb-group byb-group--free" role="group" aria-label="Free 4-packs">
            <div className="byb-group-label byb-group-label--free">{freeSlots === 1 ? "Free 4-pack" : "Free 4-packs"}</div>
            <div className="byb-group-row">{free.map((_, i) => renderFreeSlot(i))}</div>
            {!isMobile && pickerEl}
          </div>
        )}
        {percent ? (
          <div className="byb-pct-note" aria-live="polite">
            {paidFull ? (
              <>
                <strong>{percent}% off your 4-packs</strong> · you save {money(pctSavings)}
              </>
            ) : (
              <>
                Add {paidSlots} or more 4-packs for <strong>{percent}% off</strong>
              </>
            )}
          </div>
        ) : null}
      </div>
      {editable && (
        <div className="byb-foot">
          <div className="byb-foot-main">
            {progress}
            {fullNote}
          </div>
          <div className="byb-cta">
            {continueBtn("byb-continue-hint")}
            {hint("byb-continue-hint")}
          </div>
        </div>
      )}
      {isMobile && fullNote}
    </div>
  );

  // Mobile collapsed row: mini slots (tap to expand) + progress + Continue.
  const miniSlot = (p: FourPack | null, key: string, isFree: boolean) => (
    <span
      key={key}
      className={`byb-mini${p ? " is-filled" : ""}${isFree ? " is-free" : ""}${flash === key ? " is-flash" : ""}`}
      style={p ? ({ "--slot-color": p.color } as CSSProperties) : undefined}
      aria-hidden="true"
    >
      {p ? <img src={cardCanSrc(p.slug)} alt="" width={331} height={900} decoding="async" /> : "+"}
    </span>
  );
  const collapsedRow = (
    <div className="byb-collapsed">
      <button
        type="button"
        className="byb-collapsed-toggle"
        aria-expanded={expanded}
        aria-controls="byb-box-panel"
        aria-label={`Your box: ${filledCount} of ${totalSlots} filled. ${expanded ? "Collapse" : "Expand"} your box.`}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="byb-mini-group">
          {paidPacks.map((p, i) => miniSlot(p, `p${i}`, false))}
        </span>
        {freeSlots > 0 && (
          <span className="byb-mini-group byb-mini-group--free">
            <span className="byb-mini-free-label">Free</span>
            {freePacks.map((p, i) => miniSlot(p, `f${i}`, true))}
          </span>
        )}
        <span className="byb-collapsed-count">
          {filledCount}/{totalSlots}
          <span className={`byb-chevron${expanded ? " is-up" : ""}`} aria-hidden="true" />
        </span>
      </button>
      <div className="byb-collapsed-foot">
        {fullPulse && paidFull ? (
          <p className="byb-full-note is-pulse is-inline">
            Your box is full — tap × to swap a flavor.
          </p>
        ) : (
          progress
        )}
        <div className="byb-cta">{continueBtn("byb-continue-hint-m")}</div>
      </div>
      {hint("byb-continue-hint-m")}
      {percent && paidFull ? (
        <p className="byb-pct-note is-collapsed">
          <strong>{percent}% off your 4-packs</strong> · you save {money(pctSavings)}
        </p>
      ) : null}
    </div>
  );

  const renderCard = (p: FourPack) => {
    const ink = inkFor(p.color);
    const count = paid.filter((s) => s === p.slug).length;
    const disabled = paidFull;
    const style = { "--card-flavor-color": p.color, "--card-ink": ink } as CSSProperties;
    const cardLockupBase = vw <= 520 ? 28 : 44;
    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        addPaid(p);
      }
    };
    return (
      <div
        key={p.slug}
        className={`tfc-card byb-card${count ? " is-in-box" : ""}${disabled ? " is-disabled" : ""}`}
        style={style}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        aria-label={`${p.flavor}, ${p.descriptor}, ${money(priceOf(p))} 4-pack${count ? `, ${count} in your box` : ""} — ${disabled ? "box full" : "add to box"}`}
        onClick={() => addPaid(p)}
        onKeyDown={onKey}
      >
        <div className="tfc-card-can" style={{ background: p.color }}>
          <img
            src={cardCanSrc(p.slug)}
            alt={`SUNRISE ${p.flavor} hemp-infused seltzer 4-pack`}
            width={331}
            height={900}
            loading="lazy"
            decoding="async"
          />
          <Html className="tfc-card-tier" html={tierLockup(p.tier, cardLockupBase, "#FEFBE0")} />
          {p.cannabinoid && (
            <Html
              className="tfc-card-cannabinoid"
              html={cbLockup(p.cannabinoid, basePx * 0.91, "#FEFBE0")}
            />
          )}
          {count > 0 && (
            <span className="byb-card-count" aria-hidden="true" style={{ color: ink }}>
              ×{count}
            </span>
          )}
        </div>
        <div className="tfc-card-meta">
          <div className="tfc-card-name">
            {(p.nameLines ?? p.flavor.split(" ")).map((w, i, arr) => (
              <span key={i}>
                {w}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </div>
          <div className="tfc-card-descriptor">{p.descriptor}</div>
          <div className="byb-card-price">
            {money(priceOf(p))} <span className="byb-card-unit">4-pack</span>
          </div>
        </div>
      </div>
    );
  };

  // Headline: first sentence near-black, the rest on a new line in the accent
  // color (same treatment as tryfreecan's "Want a Taste? / Just Cover Shipping").
  const dot = headline.indexOf(". ");
  const headA = dot > 0 ? headline.slice(0, dot + 1) : headline;
  const headB = dot > 0 ? headline.slice(dot + 2) : "";

  const sticky = step === "build";
  const boxStyle = { "--byb-top": `${stickyTop}px` } as CSSProperties;

  return (
    <>
      <SiteHeader />

      <main className="tfc-page byb-page">
        <p className="byb-sr" aria-live="polite" aria-atomic="true">
          {announce}
        </p>

        {/* ── 01 · HERO ─────────────────────────────────────────────────── */}
        <section className="tfc-hero byb-hero">
          <div className="container">
            <h1 className="tfc-headline">
              {headA}
              {headB && (
                <>
                  <br />
                  <span className="accent">{headB}</span>
                </>
              )}
            </h1>
            <p className="tfc-subhead">{subline}</p>
          </div>
        </section>

        {step !== "reveal" && (
          /* ── 02 · THE BOX (sticky while building) ─────────────────────── */
          <div
            ref={boxRef}
            className={`byb-box${sticky ? " is-sticky" : ""}${isMobile && sticky ? " is-mobile" : ""}${picker !== null ? " has-picker" : ""}`}
            style={boxStyle}
            aria-label="Your box"
            role="region"
          >
            <div className="container">
              {isMobile && sticky ? (
                <>
                  {collapsedRow}
                  {expanded && (
                    <div id="byb-box-panel" className="byb-panel">
                      {fullBox}
                    </div>
                  )}
                  {pickerEl}
                </>
              ) : (
                fullBox
              )}
            </div>
          </div>
        )}

        {step === "build" && (
          /* ── 03 · FLAVOR GRID (paid packs) ────────────────────────────── */
          <section
            ref={gridRef}
            className="tfc-pick byb-pick-section"
            aria-label="Choose your 4-packs"
          >
            <div className="container">
              {paidFull && (
                <p className="byb-grid-note">Your box is full — tap × to swap a flavor.</p>
              )}
              <div className="tfc-groups byb-groups">
                {TIERS.map((t) => (
                  <div key={t.tier} className="tfc-group" role="group" aria-label={`${t.tier} MG`}>
                    <div className="tfc-group-head">
                      <Html
                        className="tfc-group-lockup"
                        html={tierLockup(t.tier, isMobile ? 30 : 40, t.color)}
                      />
                    </div>
                    <div className="tfc-grid">
                      {LIVE_FOUR_PACKS.filter((p) => p.tier === t.tier).map((p) => (
                        <Fragment key={p.slug}>{renderCard(p)}</Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === "email" && (
          /* ── 04 · EMAIL ───────────────────────────────────────────────── */
          <section ref={stepTopRef} className="byb-email" aria-labelledby="byb-email-title">
            <div className="container">
              <div className="byb-email-card">
                <h2 id="byb-email-title" className="tfc-claim-title byb-email-title">
                  Almost there.
                </h2>
                <p className="byb-email-line">Enter your email to lock in your deal.</p>
                <form
                  className="tfc-form"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    onUnlock();
                  }}
                >
                  <label htmlFor="byb-email" className="tfc-label">
                    Email address
                  </label>
                  <input
                    ref={emailRef}
                    id="byb-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="tfc-input"
                    placeholder="you@email.com"
                    value={email}
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "byb-email-error" : undefined}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                  />
                  {emailError && (
                    <p id="byb-email-error" className="tfc-error">
                      {emailError}
                    </p>
                  )}
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
                  <button
                    type="submit"
                    className="btn btn-primary tfc-claim-btn byb-unlock-btn"
                    disabled={unlocking}
                    aria-busy={unlocking}
                  >
                    {unlocking ? "Unlocking…" : "Unlock My Box"}
                  </button>
                  <p className="tfc-fine">
                    By entering your email, you agree to receive marketing emails from SUNRISE.
                    Unsubscribe anytime.
                  </p>
                </form>
                <button type="button" className="byb-edit" onClick={() => setStep("build")}>
                  Edit my box
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "reveal" && boxFull && (
          /* ── 05 · REVEAL ──────────────────────────────────────────────── */
          <section
            ref={stepTopRef}
            className="tfc-reveal byb-reveal"
            aria-labelledby="byb-reveal-title"
          >
            <div className="container">
              <div className="tfc-reveal-burst">
                {celebrate && <Fireworks />}
                <h2 id="byb-reveal-title" className="tfc-reveal-title">
                  Your box is ready.
                </h2>
              </div>
              <ul className="byb-summary" aria-label="Your box">
                {paidPacks.map((p, i) =>
                  p ? (
                    <li
                      key={`sp${i}`}
                      className="byb-summary-row"
                      style={{ "--slot-color": p.color } as CSSProperties}
                    >
                      <span className="byb-summary-swatch" aria-hidden="true">
                        <img
                          src={cardCanSrc(p.slug)}
                          alt=""
                          width={331}
                          height={900}
                          decoding="async"
                        />
                      </span>
                      <span className="byb-summary-name">
                        {p.flavor}
                        <Html
                          className="byb-summary-tier"
                          html={tierLockup(p.tier, 14, inkFor(p.color))}
                        />
                      </span>
                      <span className="byb-summary-price">{money(priceOf(p))}</span>
                    </li>
                  ) : null,
                )}
                {freePacks.map((p, i) =>
                  p ? (
                    <li
                      key={`sf${i}`}
                      className="byb-summary-row is-free"
                      style={{ "--slot-color": p.color } as CSSProperties}
                    >
                      <span className="byb-summary-swatch" aria-hidden="true">
                        <img
                          src={cardCanSrc(p.slug)}
                          alt=""
                          width={331}
                          height={900}
                          decoding="async"
                        />
                      </span>
                      <span className="byb-summary-name">
                        {p.flavor}
                        <Html
                          className="byb-summary-tier"
                          html={tierLockup(p.tier, 14, inkFor(p.color))}
                        />
                      </span>
                      <span className="byb-summary-price">
                        <s>{money(priceOf(p))}</s> <strong className="byb-free-tag">FREE</strong>
                      </span>
                    </li>
                  ) : null,
                )}
              </ul>
              {percent ? (
                <p className="byb-pct-reveal">
                  <strong>{percent}% off your 4-packs</strong> · you save {money(pctSavings)}
                </p>
              ) : null}
              {otherItems.length > 0 && (
                <div className="byb-also">
                  <p className="byb-also-title">Already in your cart</p>
                  <ul className="byb-summary" aria-label="Already in your cart">
                    {otherItems.map((i) => {
                      const p = packForHandle(i.productHandle);
                      const color = p?.color ?? "#C4922A";
                      const src = p ? cardCanSrc(p.slug) : i.imageUrl;
                      return (
                        <li
                          key={i.lineId ?? i.variantId}
                          className={`byb-summary-row is-also${p ? "" : " is-photo"}`}
                          style={{ "--slot-color": color } as CSSProperties}
                        >
                          <span className="byb-summary-swatch" aria-hidden="true">
                            {src ? <img src={src} alt="" width={331} height={900} decoding="async" /> : null}
                          </span>
                          <span className="byb-summary-name">
                            {p?.flavor ?? i.productTitle}
                            {p ? (
                              <Html className="byb-summary-tier" html={tierLockup(p.tier, 14, inkFor(p.color))} />
                            ) : null}
                            <span className="byb-also-pack">
                              {i.variantTitle.toLowerCase()}
                              {i.quantity > 1 ? ` × ${i.quantity}` : ""}
                            </span>
                          </span>
                          <span className="byb-summary-price">{money(Number(i.price.amount) * i.quantity)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="byb-also-note">They stay in your cart. You'll see everything together before checkout.</p>
                </div>
              )}
              <button type="button" className="tfc-code" onClick={copyCode} title="Copy code">
                <span className="tfc-code-text">{code}</span>
                <span className="tfc-code-copy">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="tfc-copy-icon">
                    <rect
                      x="8"
                      y="8"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <rect
                      x="3"
                      y="3"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
              <p className="tfc-fine tfc-code-note">Your code is saved and applied for you in the cart.</p>
              {inCart && <p className="tfc-fine byb-in-cart">Your box is in your cart.</p>}
              <button
                type="button"
                className="btn btn-primary tfc-checkout-btn"
                onClick={onPrimary}
                disabled={checkoutBusy}
                aria-busy={checkoutBusy}
              >
                {checkoutBusy ? (primaryLabel === "Add to Cart" ? "Adding…" : "Opening checkout…") : primaryLabel}
              </button>
              <button
                type="button"
                className="byb-edit byb-keep-shopping"
                onClick={onSecondary}
                disabled={checkoutBusy}
              >
                {secondaryLabel}
              </button>
              {checkoutError && (
                <p className="tfc-error" role="alert">
                  {checkoutError}
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
