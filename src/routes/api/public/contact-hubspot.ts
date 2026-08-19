// Public contact-form HubSpot write — the non-blocking, secondary half of the
// contact-form dual-write. The form's success message + its two emails are
// owned entirely by /api/public/contact (Supabase log + Lovable email queue);
// the front end calls THIS endpoint in parallel, without awaiting it, purely to
// sync the lead into HubSpot. A failure or slowdown here can never delay or
// block the success message or the emails.
//
// Clones the connector-gateway auth/create-or-update pattern from
// spin-wheel-hubspot.ts — same gateway, same keys, no new integration.
//
// IMPORTANT — this endpoint deliberately does NOT set `contact_type`. The
// contact form is mixed-audience (its reason dropdown includes Wholesale /
// Retail Partnership and Media / Press), so auto-stamping "DTC Customer" here
// would mislabel business/press inquiries and corrupt DTC-vs-distributor
// segmentation. The founder classifies these leads manually. (The wheel/footer
// endpoints DO stamp contact_type because they are consumer-only touchpoints.)
import { createFileRoute } from '@tanstack/react-router'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  name?: unknown
  email?: unknown
}

export const Route = createFileRoute('/api/public/contact-hubspot')({
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

        // Split full name into first token / remainder. Missing or single-token
        // names simply omit the empty field rather than send a blank string.
        const rawName = typeof body.name === 'string' ? body.name.trim() : ''
        const nameParts = rawName.split(/\s+/).filter(Boolean)
        const firstname = nameParts.length > 0 ? nameParts[0] : ''
        const lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }

        // CREATE path — classification for a brand-new contact. lifecyclestage
        // is stamped HERE ONLY, never on update, so a returning customer who
        // uses the contact form is never regressed to a lead. NOTE: no
        // contact_type (see file header) and no event_signup_source.
        const createProperties: Record<string, string> = {
          email,
          contact_source: 'Website',
          web_signup_source: 'Contact Form',
          lifecyclestage: 'lead',
        }
        if (firstname) createProperties.firstname = firstname
        if (lastname) createProperties.lastname = lastname

        const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ properties: createProperties }),
        })

        if (createRes.ok) {
          return Response.json({ success: true, created: true })
        }

        // UPDATE path (409 = contact already exists, deduped on email). Only
        // stamp web_signup_source — never touch lifecyclestage, contact_type,
        // contact_source, or overwrite an existing name. Never relabel or
        // regress an existing contact.
        if (createRes.status === 409) {
          const updateProperties: Record<string, string> = {
            web_signup_source: 'Contact Form',
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
          console.error('contact-form HubSpot update failed', updateRes.status, text)
          return Response.json({ error: 'HubSpot update failed' }, { status: 502 })
        }

        const text = await createRes.text()
        console.error('contact-form HubSpot create failed', createRes.status, text)
        return Response.json({ error: 'HubSpot create failed' }, { status: 502 })
      },
    },
  },
})
