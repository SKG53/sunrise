// Server-side HubSpot lookup helper — reads an existing contact's first-touch
// fields so the Klaviyo write can mirror them. HubSpot is the system of record for
// first-touch attribution: a visitor can reach HubSpot first via the Contact form
// (HubSpot-only, no Klaviyo write), so if each system decided "first touch" on its
// own, HubSpot could read web_signup_source = "Contact Form" while Klaviyo recorded
// "Website Pop-up" for the same person. The Klaviyo routes call this before
// klaviyoClaim and copy HubSpot's existing non-empty values over their own defaults.
//
// Uses the same connector-gateway GET the HubSpot handlers use. BEST-EFFORT: on a
// 404 (no contact yet), any error, or missing keys it returns null and the caller
// falls back to its defaults. It never throws and must never block the Klaviyo write.
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'

// The first-touch / fill-when-blank fields HubSpot owns. Deal fields are NOT here —
// those are latest-claim values set per claim and are never sourced from HubSpot.
const FIRST_TOUCH_FIELDS = [
  'contact_type',
  'contact_source',
  'web_signup_source',
  'capture_page',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const

export type HubspotFirstTouch = Partial<Record<(typeof FIRST_TOUCH_FIELDS)[number], string>>

// Returns the contact's non-empty first-touch fields, or null if the contact
// doesn't exist / the lookup can't be made. Only non-empty values are included, so
// callers can use `hs?.field || <default>`.
export async function fetchHubspotFirstTouch(email: string): Promise<HubspotFirstTouch | null> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY
  const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY
  if (!LOVABLE_API_KEY || !HUBSPOT_API_KEY) return null

  try {
    const res = await fetch(
      `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=${FIRST_TOUCH_FIELDS.join(',')}`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    )
    // 404 = no such contact yet (their first touch is this write) → use defaults.
    if (!res.ok) return null
    const json = (await res.json().catch(() => null)) as { properties?: Record<string, unknown> } | null
    const props = json?.properties
    if (!props) return null
    const out: HubspotFirstTouch = {}
    for (const f of FIRST_TOUCH_FIELDS) {
      const v = props[f]
      if (typeof v === 'string' && v.trim() !== '') out[f] = v
    }
    return out
  } catch (e) {
    console.error('fetchHubspotFirstTouch error', (e as Error)?.message)
    return null
  }
}
