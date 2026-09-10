// First-touch UTM persistence, mirroring the fbc/fbp cookie pattern in __root.tsx.
// captureUtms(): call once, as early as possible on load.
// readUtms(): call at capture/submit time.
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const COOKIE = 'sr_utms'

export function captureUtms(): void {
  if (typeof document === 'undefined') return
  if (readCookie(COOKIE)) return // first-touch: never overwrite a prior source
  const q = new URLSearchParams(location.search)
  const found: Record<string, string> = {}
  for (const k of KEYS) { const v = q.get(k); if (v) found[k] = v }
  if (Object.keys(found).length === 0) return
  document.cookie =
    `${COOKIE}=${encodeURIComponent(JSON.stringify(found))}` +
    '; path=/; domain=.savorsunrise.com; max-age=7776000; SameSite=Lax; Secure'
}

export function readUtms(): Record<string, string> {
  const raw = typeof document !== 'undefined' ? readCookie(COOKIE) : null
  if (raw) { try { return JSON.parse(decodeURIComponent(raw)) } catch { /* fall through */ } }
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
  const found: Record<string, string> = {}
  for (const k of KEYS) { const v = q.get(k); if (v) found[k] = v }
  return found
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? m[1] : null
}


// ── AD-VISITOR DETECTION ──────────────────────────────────────────────────
// A visitor is treated as arriving from a paid ad if ANY signal is present:
//   1. fbclid in the URL — Meta appends this to every ad click automatically
//      (the load-bearing catch-all; works regardless of campaign/ad set/ad).
//   2. paid utm_medium (paid/cpc/paid_social) or ad-source utm_source
//      (meta/facebook/ig/instagram) — checked on the current URL AND the
//      persisted sr_utms cookie.
//   3. ?src=meta — optional belt-and-suspenders if set on the ad destination.
// The flag is persisted to localStorage with a timestamp and treated as valid
// for 30 days from first/most-recent detection (repeat ad clicks slide the
// window). Deliberately INDEPENDENT of captureUtms()'s first-touch cookie guard
// so an organic-first visitor who later clicks an ad is still flagged.
const AD_KEY = 'sunrise:ad-visitor'
const AD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function hasAdSignal(): boolean {
  if (typeof location === 'undefined') return false
  const q = new URLSearchParams(location.search)
  if (q.get('fbclid')) return true
  if (q.get('src') === 'meta') return true
  const PAID_MEDIUM = ['paid', 'cpc', 'paid_social']
  const AD_SOURCE = ['meta', 'facebook', 'ig', 'instagram']
  // current URL params
  const med = (q.get('utm_medium') || '').toLowerCase()
  const src = (q.get('utm_source') || '').toLowerCase()
  if (PAID_MEDIUM.includes(med) || AD_SOURCE.includes(src)) return true
  // persisted (first-touch) UTMs
  const u = readUtms()
  const pmed = (u.utm_medium || '').toLowerCase()
  const psrc = (u.utm_source || '').toLowerCase()
  if (PAID_MEDIUM.includes(pmed) || AD_SOURCE.includes(psrc)) return true
  return false
}

// Call once, as early as possible on load (alongside captureUtms). Runs every
// load until — and after — the flag is set; a fresh ad signal refreshes the
// 30-day window. No-op when no ad signal is present.
export function captureAdVisitor(): void {
  if (typeof window === 'undefined') return
  if (!hasAdSignal()) return
  try { localStorage.setItem(AD_KEY, JSON.stringify({ ts: Date.now() })) } catch { /* private mode */ }
}

// Read at decision time (e.g. the spin pick). True only if the flag exists AND
// is within the 30-day window; an expired or absent flag reads as organic.
export function isAdVisitor(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(AD_KEY)
    if (!raw) return false
    const { ts } = JSON.parse(raw)
    return typeof ts === 'number' && Date.now() - ts <= AD_WINDOW_MS
  } catch {
    return false
  }
}
