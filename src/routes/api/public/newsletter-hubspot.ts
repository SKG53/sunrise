// Public newsletter HubSpot write — the non-blocking, secondary half of the
// footer newsletter dual-write. The footer's Supabase save (/api/public/
// newsletter) remains the sole gate for the footer success message; the front
// end (SiteFooter.tsx) calls THIS endpoint in parallel, without awaiting it,
// purely to sync the subscriber into HubSpot. A failure or slowdown here can
// never delay the footer's success state or surface an error to the user.
//
// Mirrors the connector-gateway auth/create-or-update pattern used by
// spin-wheel-hubspot.ts — same gateway, same keys, no new integration. The
// only differences are the route path and the web_signup_source value.
import { createFileRoute } from '@tanstack/react-router'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: unknown
}

export const Route = createFileRoute('/api/public/newsletter-hubspot')({
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

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }

        // CREATE path — full classification for a brand-new contact.
        // lifecyclestage is stamped HERE ONLY, never on update (spec §5.2), so a
        // returning customer who signs up via the footer is never regressed to a lead.
        const createProperties: Record<string, string> = {
          email,
          contact_type: 'DTC Customer',
          contact_source: 'Website',
          web_signup_source: 'Newsletter',
          lifecyclestage: 'lead',
        }

        const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ properties: createProperties }),
        })

        if (createRes.ok) {
          return Response.json({ success: true, created: true })
        }

        // UPDATE path (409 = contact already exists, deduped on email).
        // Do NOT touch lifecyclestage, contact_type, or contact_source — never
        // relabel or regress an existing contact (spec §5.2 / §5.3). Only stamp
        // the web signup source.
        if (createRes.status === 409) {
          const updateProperties: Record<string, string> = {
            web_signup_source: 'Newsletter',
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
          console.error('newsletter HubSpot update failed', updateRes.status, text)
          return Response.json({ error: 'HubSpot update failed' }, { status: 502 })
        }

        const text = await createRes.text()
        console.error('newsletter HubSpot create failed', createRes.status, text)
        return Response.json({ error: 'HubSpot create failed' }, { status: 502 })
      },
    },
  },
})
