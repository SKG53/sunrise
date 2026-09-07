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
