// Server-side Klaviyo helper — calls the Klaviyo API directly (Lovable has no
// Klaviyo connector gateway, unlike HubSpot). Reads the private key from
// process.env.KLAVIYO_API_KEY, set in Lovable's Secrets panel exactly like
// HUBSPOT_API_KEY. Every exported function is BEST-EFFORT: the popup's reward
// reveal is gated only on the Supabase write, so callers fire these without
// awaiting them. Failures are logged and swallowed here, never thrown.
//
// Field names mirror HubSpot one-to-one (brief "mirror rule"). Write rules:
//   first-capture, set only if blank : web_signup_source, capture_page
//   latest-claim, overwrite          : popup_type, deal_code, deals_offered,
//                                       deal_date, ad_variant
//   utm_*                            : set from payload (first-touch values)
//   deals_won                        : read-modify-write, append code if absent

const BASE = 'https://a.klaviyo.com/api'
// Pin the API revision; bump deliberately when adopting a newer Klaviyo revision.
const REVISION = '2026-04-15'
// "SUNRISE Subscribers" list, single opt-in.
export const SUNRISE_LIST_ID = 'Sg934Q'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const OVERWRITE_KEYS = ['popup_type', 'deal_code', 'deals_offered', 'deal_date', 'ad_variant'] as const

export interface KlaviyoClaimInput {
  email: string
  web_signup_source: string // "Website Pop-up" or "Newsletter"
  contact_type?: string // mirror of HubSpot contact_type (e.g. "DTC Customer"); filled only when blank
  contact_source?: string // mirror of HubSpot contact_source (e.g. "Website"); filled only when blank
  capture_page?: string
  popup_type?: string
  deal_code?: string
  deals_offered?: string
  deal_date?: string
  ad_variant?: string
  deal_won_code?: string // appended to deals_won if absent
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  logEvent?: boolean // fire the "Claimed Deal" event (spin/ad claims only)
  // Footer only: logs the "Newsletter Signup" event (Welcome flow trigger).
  // capture_page here is the submitting page and goes ONLY into the event,
  // never into the profile's capture_page field.
  newsletterEvent?: { form: string; capture_page?: string }
}

function authHeaders(key: string) {
  return {
    Authorization: `Klaviyo-API-Key ${key}`,
    revision: REVISION,
    accept: 'application/vnd.api+json',
    'content-type': 'application/vnd.api+json',
  }
}

// Build the custom-properties object per the write rules. `cur` is the profile's
// current properties (empty object for a brand-new profile).
function buildProps(
  input: KlaviyoClaimInput,
  cur: Record<string, unknown>,
): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  // Classification — mirror of the HubSpot handlers. Both are filled only when
  // blank (never relabel/clobber). contact_source is fill-when-blank rather than
  // new-profile-only on purpose: Shopify creates Klaviyo profiles at checkout, so
  // a person can already exist in Klaviyo while being brand-new to HubSpot — with
  // new-profile-only they'd get "Website" in HubSpot but blank in Klaviyo.
  if (input.contact_type && !cur.contact_type) props.contact_type = input.contact_type
  if (input.contact_source && !cur.contact_source) props.contact_source = input.contact_source
  // first-capture — set only if currently blank
  if (!cur.web_signup_source && input.web_signup_source) props.web_signup_source = input.web_signup_source
  if (!cur.capture_page && input.capture_page) props.capture_page = input.capture_page
  // utm_* — FIRST-TOUCH: written only alongside the first web signup (when no
  // source is set yet), never overwritten on a returning profile. Mirrors the
  // unchanged HubSpot UTM behavior.
  if (!cur.web_signup_source) {
    for (const k of UTM_KEYS) {
      const v = input[k]
      if (v) props[k] = v
    }
  }
  // latest-claim — overwrite
  for (const k of OVERWRITE_KEYS) {
    const v = input[k]
    if (v) props[k] = v
  }
  // deals_won — read-modify-write, append if absent
  if (input.deal_won_code) {
    const curWon = typeof cur.deals_won === 'string' ? cur.deals_won : ''
    const list = curWon ? curWon.split(',').map((s) => s.trim()).filter(Boolean) : []
    if (!list.includes(input.deal_won_code)) list.push(input.deal_won_code)
    props.deals_won = list.join(', ')
  }
  return props
}

async function getProfileById(
  key: string,
  id: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/profiles/${encodeURIComponent(id)}/`, { headers: authHeaders(key) })
  if (!res.ok) {
    console.error('klaviyo getProfileById failed', res.status)
    return {}
  }
  const json = (await res.json().catch(() => null)) as
    | { data?: { attributes?: { properties?: Record<string, unknown> } } }
    | null
  return json?.data?.attributes?.properties ?? {}
}

async function patchProfile(key: string, id: string, properties: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BASE}/profiles/${encodeURIComponent(id)}/`, {
    method: 'PATCH',
    headers: authHeaders(key),
    body: JSON.stringify({ data: { type: 'profile', id, attributes: { properties } } }),
  })
  if (!res.ok) console.error('klaviyo patchProfile failed', res.status, await res.text().catch(() => ''))
}

// Subscribe (and create if needed) the email to SUNRISE Subscribers with email
// marketing consent. The list is single opt-in, so consent is immediate.
async function subscribe(key: string, email: string): Promise<void> {
  const res = await fetch(`${BASE}/profile-subscription-bulk-create-jobs/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email,
                  subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
                },
              },
            ],
          },
        },
        relationships: { list: { data: { type: 'list', id: SUNRISE_LIST_ID } } },
      },
    }),
  })
  if (!res.ok) console.error('klaviyo subscribe failed', res.status, await res.text().catch(() => ''))
}

async function logClaimedDeal(key: string, input: KlaviyoClaimInput): Promise<void> {
  const properties: Record<string, unknown> = {
    deal_code: input.deal_code,
    deals_offered: input.deals_offered,
    popup_type: input.popup_type,
    capture_page: input.capture_page,
  }
  if (input.ad_variant) properties.ad_variant = input.ad_variant
  for (const k of UTM_KEYS) {
    const v = input[k]
    if (v) properties[k] = v
  }
  const res = await fetch(`${BASE}/events/`, {
    method: 'POST',
    headers: authHeaders(key),
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          metric: { data: { type: 'metric', attributes: { name: 'Claimed Deal' } } },
          properties,
          profile: { data: { type: 'profile', attributes: { email: input.email } } },
        },
      },
    }),
  })
  if (!res.ok) console.error('klaviyo logClaimedDeal failed', res.status, await res.text().catch(() => ''))
}

// Footer-only "Newsletter Signup" event — the Welcome flow trigger. Logs and
// swallows every failure (HTTP or network); never throws.
async function logNewsletterSignup(key: string, input: KlaviyoClaimInput): Promise<void> {
  const ev = input.newsletterEvent
  if (!ev) return
  try {
    const properties: Record<string, unknown> = { form: ev.form }
    if (ev.capture_page) properties.capture_page = ev.capture_page
    for (const k of UTM_KEYS) {
      const v = input[k]
      if (v) properties[k] = v
    }
    const res = await fetch(`${BASE}/events/`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: 'Newsletter Signup' } } },
            properties,
            profile: { data: { type: 'profile', attributes: { email: input.email } } },
          },
        },
      }),
    })
    if (!res.ok) console.error('klaviyo logNewsletterSignup failed', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('klaviyo logNewsletterSignup error', (e as Error)?.message)
  }
}

// Upsert the profile (synchronously, race-free), set consent + list, and — for
// deal claims — log the Claimed Deal event; for footer signups, the Newsletter
// Signup event. Never throws.
export async function klaviyoClaim(input: KlaviyoClaimInput): Promise<void> {
  const key = process.env.KLAVIYO_API_KEY
  if (!key) {
    console.error('KLAVIYO_API_KEY is not configured')
    return
  }
  const email = input.email
  try {
    // 1. Create the profile with properties. If it already exists (409), Klaviyo
    //    returns the existing id in the error meta — read its current properties
    //    (for the deals_won RMW) and PATCH the merged set.
    const createRes = await fetch(`${BASE}/profiles/`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify({
        data: { type: 'profile', attributes: { email, properties: buildProps(input, {}) } },
      }),
    })
    if (!createRes.ok) {
      if (createRes.status === 409) {
        const errJson = (await createRes.json().catch(() => null)) as
          | { errors?: Array<{ meta?: { duplicate_profile_id?: string } }> }
          | null
        const id = errJson?.errors?.[0]?.meta?.duplicate_profile_id
        if (id) {
          const cur = await getProfileById(key, id)
          const merged = buildProps(input, cur)
          if (Object.keys(merged).length) await patchProfile(key, id, merged)
        } else {
          console.error('klaviyo create 409 without duplicate_profile_id')
        }
      } else {
        console.error('klaviyo create failed', createRes.status, await createRes.text().catch(() => ''))
      }
    }
    // 2. Subscribe to the list with marketing consent (identity now exists).
    await subscribe(key, email)
    // 3. Claimed Deal event (spin/ad claims only; footer signups skip it).
    if (input.logEvent && input.deal_code) await logClaimedDeal(key, input)
    // 3b. Newsletter Signup event (footer only) — triggers the Welcome flow.
    if (input.newsletterEvent) await logNewsletterSignup(key, input)
  } catch (e) {
    console.error('klaviyoClaim error', (e as Error)?.message)
  }
}

// ── Reviews (/api/public/review) ─────────────────────────────────────────
// Both helpers are best-effort and never throw. A review is NOT marketing
// consent: nothing here subscribes, changes consent, or writes profile
// properties.

const PLACED_ORDER_METRIC_ID = 'Rtyn8R' // Shopify "Placed Order"
const LOOKUP_TIMEOUT_MS = 4000

// Logs the "Review Submitted" event (no properties). Used to stop Review
// Request emails for people who have already reviewed. Klaviyo creates a
// bare profile if none exists — still no consent change.
export async function logReviewSubmitted(email: string): Promise<void> {
  const key = process.env.KLAVIYO_API_KEY
  if (!key) {
    console.error('KLAVIYO_API_KEY is not configured')
    return
  }
  try {
    const res = await fetch(`${BASE}/events/`, {
      method: 'POST',
      headers: authHeaders(key),
      body: JSON.stringify({
        data: {
          type: 'event',
          attributes: {
            metric: { data: { type: 'metric', attributes: { name: 'Review Submitted' } } },
            properties: {},
            profile: { data: { type: 'profile', attributes: { email } } },
          },
        },
      }),
    })
    if (!res.ok) console.error('klaviyo logReviewSubmitted failed', res.status, await res.text().catch(() => ''))
  } catch (e) {
    console.error('klaviyo logReviewSubmitted error', (e as Error)?.message)
  }
}

// True if the profile with this email has at least one Placed Order event.
// Any miss — no key, no profile, missing read scope, timeout, error — is false.
export async function klaviyoHasPlacedOrder(email: string): Promise<boolean> {
  const key = process.env.KLAVIYO_API_KEY
  if (!key || email.includes('"')) return false
  try {
    const profileFilter = encodeURIComponent(`equals(email,"${email}")`)
    const pRes = await fetch(`${BASE}/profiles/?filter=${profileFilter}&fields[profile]=email`, {
      headers: authHeaders(key),
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    })
    if (!pRes.ok) {
      console.error('klaviyo profile lookup failed', pRes.status)
      return false
    }
    const pJson = (await pRes.json().catch(() => null)) as { data?: Array<{ id?: string }> } | null
    const id = pJson?.data?.[0]?.id
    if (!id) return false
    const eventFilter = encodeURIComponent(
      `and(equals(metric_id,"${PLACED_ORDER_METRIC_ID}"),equals(profile_id,"${id}"))`,
    )
    const eRes = await fetch(`${BASE}/events/?filter=${eventFilter}&fields[event]=datetime`, {
      headers: authHeaders(key),
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    })
    if (!eRes.ok) {
      console.error('klaviyo order lookup failed', eRes.status)
      return false
    }
    const eJson = (await eRes.json().catch(() => null)) as { data?: unknown[] } | null
    return Array.isArray(eJson?.data) && eJson!.data!.length > 0
  } catch (e) {
    console.error('klaviyo hasPlacedOrder error', (e as Error)?.message)
    return false
  }
}
