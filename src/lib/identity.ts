// Who is this browser? One localStorage record, `sunrise:kl-id`, shared by the
// Klaviyo client events, the cart's checkout email step and the deal pages.
//
//   { email?, kx?, ts }
//
// Set ONLY from places where the shopper gave us their email on purpose:
//   - Spin & Save / ad-deal claim (SpinWheel)        → setIdentityEmail
//   - Free-can claim (FreeSampleSection)             → setIdentityEmail
//   - Footer newsletter signup (SiteFooter)          → setIdentityEmail
//   - Build Your Box unlock (BuildYourBox)           → setIdentityEmail
//   - Cart "email before checkout" step              → setIdentityEmail
//   - Klaviyo email click (`_kx` in the URL, __root) → setIdentityKx
// NOT the review page, contact form or wholesale form.
//
// Shared devices (review 4.3a): identity expires after 60 days; a DIFFERENT
// `_kx` than the stored one means a different person clicked an email, so the
// stored email is dropped; the cart shows "Checking out as … · Not you?"
// (clearIdentityEmail). Names are not collected (founder: email only).
//
// Every read/write is try/catch guarded and never throws. Listeners
// (subscribeIdentity) let siteEvents flush queued events and the cart attach
// the email to the Shopify cart.

export type Identity = { email?: string; kx?: string; ts: number };

const KEY = "sunrise:kl-id";
const TTL_MS = 60 * 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const listeners = new Set<(id: Identity | null) => void>();

export function getIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Identity>;
    const ts = typeof v.ts === "number" ? v.ts : 0;
    if (!ts || Date.now() - ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    const email = typeof v.email === "string" ? v.email : undefined;
    const kx = typeof v.kx === "string" ? v.kx : undefined;
    if (!email && !kx) return null;
    return { email, kx, ts };
  } catch {
    return null;
  }
}

/** Email we can prefill / skip the checkout email step with. */
export function knownEmail(): string | null {
  return getIdentity()?.email ?? null;
}

/** Known at all (email OR Klaviyo click). Deal pages treat both as known. */
export function isKnownBrowser(): boolean {
  return !!getIdentity();
}

function save(next: Identity | null) {
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
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

export function setIdentityEmail(email: string): void {
  if (typeof window === "undefined") return;
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value) || value.length > 320) return;
  const cur = getIdentity();
  save({ email: value, kx: cur?.kx, ts: Date.now() });
}

export function setIdentityKx(kx: string): void {
  if (typeof window === "undefined") return;
  const value = kx.trim();
  if (!value || value.length > 512) return;
  const cur = getIdentity();
  if (cur?.kx === value) {
    save({ ...cur, ts: Date.now() });
    return;
  }
  // A new or different Klaviyo click may be a different person on this
  // device, so the stored email is never carried over. (Cost for the same
  // person: they type their email once at checkout. Safer than prefilling
  // someone else's.)
  save({ kx: value, ts: Date.now() });
}

/** "Not you?" in the cart. */
export function clearIdentityEmail(): void {
  if (typeof window === "undefined") return;
  save(null);
}

export function subscribeIdentity(fn: (id: Identity | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** a…@gmail.com */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return email;
  return `${user.slice(0, 1)}…@${domain}`;
}
