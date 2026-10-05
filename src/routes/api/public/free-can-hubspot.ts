// Public free can HubSpot write — the non-blocking, secondary half of the
// "Want a Taste?" email gate (components/FreeSampleSection.tsx). The Supabase
// save (/api/public/newsletter, source "free-can") remains the sole gate for
// the code reveal; the front end calls THIS endpoint in parallel, without
// awaiting it, purely to sync the contact into HubSpot. A failure or slowdown
// here can never delay the reveal or surface an error to the user.
//
// Copy of newsletter-hubspot.ts — same gateway, same keys, same write rules.
// The only differences are the route path and web_signup_source = Free Can.
import { createFileRoute } from '@tanstack/react-router'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

export const Route = createFileRoute('/api/public/free-can-hubspot')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY
        const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY
        if (!LOVABLE_API_KEY) {
          return Response.json({ error: 'LOVABLE_API_KEY is not configured' }, { status: 500 })
        }
        if (!HUBSPOT_API_KEY) {
          return Response.json({ error: 'HUBSPOT_API_KEY is not configured' }, { status: 500 })
        }

        let body: Body
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
          return Response.json({ error: 'Valid email is required' }, { status: 400 })
        }

        // UTM attribution — pass through verbatim (length-guarded only).
        const asUtm = (v: unknown) => (typeof v === 'string' && v.length <= 512 ? v : '')
        const utm_source = asUtm(body.utm_source)
        const utm_medium = asUtm(body.utm_medium)
        const utm_campaign = asUtm(body.utm_campaign)
        const utm_content = asUtm(body.utm_content)
        const utm_term = asUtm(body.utm_term)

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }

        // CREATE path — full classification for a brand-new contact.
        // lifecyclestage is stamped HERE ONLY, never on update (spec §5.2), so a
        // returning customer who claims a free can is never regressed to a lead.
        const createProperties: Record<string, string> = {
          email,
          contact_type: 'DTC Customer',
          contact_source: 'Website',
          web_signup_source: 'Free Can',
          lifecyclestage: 'lead',
        }
        if (utm_source) createProperties.utm_source = utm_source
        if (utm_medium) createProperties.utm_medium = utm_medium
        if (utm_campaign) createProperties.utm_campaign = utm_campaign
        if (utm_content) createProperties.utm_content = utm_content
        if (utm_term) createProperties.utm_term = utm_term

        const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ properties: createProperties }),
        })

        if (createRes.ok) {
          return Response.json({ success: true, created: true })
        }

        // UPDATE path (409 = contact already exists, deduped on email).
        // Do NOT touch lifecyclestage or contact_source — never relabel or
        // regress an existing contact. contact_type and web_signup_source are
        // filled ONLY when blank (brief item 2: back-fill untyped contacts, e.g.
        // ones the Contact form created with no type, without ever overwriting
        // an existing Distributor / Wholesale / Commercial / Internal label).
        if (createRes.status === 409) {
          // One widened lookup feeds both only-if-blank decisions.
          const lookupRes = await fetch(
            `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=contact_type,web_signup_source`,
            { headers },
          )

          const updateProperties: Record<string, string> = {}

          if (!lookupRes.ok) {
            // Can't confirm what's blank — skip the write rather than risk
            // clobbering a first-touch source, the UTMs, or an existing
            // contact_type.
            const text = await lookupRes.text()
            console.error('free-can HubSpot lookup failed', lookupRes.status, text)
          } else {
            const existing = (await lookupRes.json().catch(() => ({}))) as {
              properties?: { contact_type?: string; web_signup_source?: string }
            }
            const props = existing.properties ?? {}
            if (!props.contact_type) updateProperties.contact_type = 'DTC Customer'
            // First-touch: stamp the source AND the UTMs together, only on the
            // first web signup (when no source is set yet). Never overwrite a
            // returning contact's UTMs — unchanged from pre-popup behavior.
            if (!props.web_signup_source) {
              updateProperties.web_signup_source = 'Free Can'
              if (utm_source) updateProperties.utm_source = utm_source
              if (utm_medium) updateProperties.utm_medium = utm_medium
              if (utm_campaign) updateProperties.utm_campaign = utm_campaign
              if (utm_content) updateProperties.utm_content = utm_content
              if (utm_term) updateProperties.utm_term = utm_term
            }
          }

          if (Object.keys(updateProperties).length === 0) {
            return Response.json({ success: true, updated: false, preserved: true })
          }

          const updateRes = await fetch(
            `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ properties: updateProperties }),
            },
          )
          if (updateRes.ok) {
            return Response.json({ success: true, updated: true })
          }
          const text = await updateRes.text()
          console.error('free-can HubSpot update failed', updateRes.status, text)
          return Response.json({ error: 'HubSpot update failed' }, { status: 502 })
        }

        const text = await createRes.text()
        console.error('free-can HubSpot create failed', createRes.status, text)
        return Response.json({ error: 'HubSpot create failed' }, { status: 502 })
      },
    },
  },
})
