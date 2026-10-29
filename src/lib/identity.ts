// Who is this browser? One localStorage record, `sunrise:kl-id`, shared by the
// Klaviyo client events, the cart's checkout email step and the deal pages.
//
//   { email?, kx?, firstName?, lastName?, ts }
//
// Set ONLY from places where the shopper gave us their email on purpose:
//   - Spin & Save / ad-deal claim (SpinWheel)        → setIdentityEmail
//   - Free-can claim (FreeSampleSection)             → setIdentityEmail
//   - Footer newsletter signup (SiteFooter)          → setIdentityEmail
//   - Build Your Box unlock (BuildYourBox)           → setIdentityEmail
//   - Cart "where should we send your receipt" step  → setIdentityEmail (+ names)
//   - Klaviyo email click (`_kx` in the URL, __root) → setIdentityKx
// NOT the review page, contact form or wholesale form (not purchase intent).
//
// Every read/write is try/catch guarded (private mode, SSR) and never throws.
// Listeners (subscribeIdentity) let siteEvents flush events that happened
// before the visitor was known (e.g. Wheel Shown → Wheel Spun → claim).

export type Identity = {
  email?: string;
  kx?: string;
  firstName?: string;
  lastName?: string;
  ts: number;
};

const KEY = "sunrise:kl-id";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const listeners = new Set<(id: Identity) => void>();

export function getIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Identity>;
    if (!v || (typeof v.email !== "string" && typeof v.kx !== "string")) return null;
    return {
      email: typeof v.email === "string" ? v.email : undefined,
      kx: typeof v.kx === "string" ? v.kx : undefined,
      firstName: typeof v.firstName === "string" ? v.firstName : undefined,
      lastName: typeof v.lastName === "string" ? v.lastName : undefined,
      ts: typeof v.ts === "number" ? v.ts : Date.now(),
    };
  } catch {
    return null;
  }
}

/** Email we can prefill / skip the checkout email step with. */
export function knownEmail(): string | null {
  return getIdentity()?.email ?? null;
}

function save(next: Identity) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — events simply stay anonymous */
  }
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch {
      /* a listener must never break the caller */
    }
  });
}

export function setIdentityEmail(
  email: string,
  names?: { firstName?: string; lastName?: string },
): void {
  if (typeof window === "undefined") return;
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value) || value.length > 320) return;
  const cur = getIdentity();
  const clean = (s?: string) => {
    const t = (s ?? "").trim().slice(0, 80);
    return t || undefined;
  };
  // A different email = a different person on this browser: drop old names.
  const sameEmail = cur?.email === value;
  save({
    email: value,
    kx: cur?.kx,
    firstName: clean(names?.firstName) ?? (sameEmail ? cur?.firstName : undefined),
    lastName: clean(names?.lastName) ?? (sameEmail ? cur?.lastName : undefined),
    ts: Date.now(),
  });
}

export function setIdentityKx(kx: string): void {
  if (typeof window === "undefined") return;
  const value = kx.trim();
  if (!value || value.length > 512) return;
  const cur = getIdentity();
  if (cur?.kx === value) return;
  save({ ...(cur ?? { ts: Date.now() }), kx: value, ts: Date.now() });
}

/** Capture `_kx` from a Klaviyo email click. Call once on load (__root). */
export function captureKxFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const kx = new URLSearchParams(window.location.search).get("_kx");
    if (kx) setIdentityKx(kx);
  } catch {
    /* malformed URL — no-op */
  }
}

export function subscribeIdentity(fn: (id: Identity) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
