// Public wholesale HubSpot write — the non-blocking, structured half of the
// wholesale-form dual-write. The form's success message + its two emails are
// owned entirely by /api/public/contact; the front end (wholesale.tsx) calls
// THIS endpoint in parallel, without awaiting it, purely to sync a structured
// wholesale contact into HubSpot. A failure or slowdown here can never delay or
// block the success message or the emails.
//
// Clones the connector-gateway auth/create-or-update pattern from
// contact-hubspot.ts, but this form is single-audience (wholesale only), so —
// unlike the general contact form — it DOES stamp contact_type and the business
// fields. Write rules: new contacts get the full classification + business
// bundle; existing contacts are only back-filled where blank (never relabel or
// clobber an existing type, source, or business data). lifecyclestage is stamped
// on create only, so a returning customer is never regressed to a lead.
import { createFileRoute } from '@tanstack/react-router'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  businessName?: unknown
  address?: unknown
  city?: unknown
  state?: unknown
  zip?: unknown
  message?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

export const Route = createFileRoute('/api/public/wholesale-hubspot')({
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

        const asStr = (v: unknown, max = 512) => (typeof v === 'string' && v.trim().length <= max ? v.trim() : '')
        const firstname = asStr(body.firstName, 100)
        const lastname = asStr(body.lastName, 100)
        const company = asStr(body.businessName, 200)
        const address = asStr(body.address, 300)
        const city = asStr(body.city, 100)
        const state = asStr(body.state, 100)
        const zip = asStr(body.zip, 20)
        const message = asStr(body.message, 5000)

        const asUtm = (v: unknown) => (typeof v === 'string' && v.length <= 512 ? v : '')
        const utm_source = asUtm(body.utm_source)
        const utm_medium = asUtm(body.utm_medium)
        const utm_campaign = asUtm(body.utm_campaign)
        const utm_content = asUtm(body.utm_content)
        const utm_term = asUtm(body.utm_term)

        const addUtms = (p: Record<string, string>) => {
          if (utm_source) p.utm_source = utm_source
          if (utm_medium) p.utm_medium = utm_medium
          if (utm_campaign) p.utm_campaign = utm_campaign
          if (utm_content) p.utm_content = utm_content
          if (utm_term) p.utm_term = utm_term
        }

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }

        // CREATE path — full classification + business bundle for a new contact.
        const createProperties: Record<string, string> = {
          email,
          contact_type: 'Wholesale Retail Customer',
          contact_source: 'Website',
          web_signup_source: 'Wholesale Contact Form',
          lifecyclestage: 'lead',
        }
        if (firstname) createProperties.firstname = firstname
        if (lastname) createProperties.lastname = lastname
        if (company) createProperties.company = company
        if (address) createProperties.address = address
        if (city) createProperties.city = city
        if (state) createProperties.state = state
        if (zip) createProperties.zip = zip
        if (message) createProperties.message = message
        addUtms(createProperties)

        const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ properties: createProperties }),
        })

        if (createRes.ok) {
          return Response.json({ success: true, created: true })
        }

        // UPDATE path (409 = contact already exists, deduped on email). Only
        // back-fill where blank — never relabel contact_type, overwrite the
        // acquisition source, or clobber existing business data. Never touch
        // lifecyclestage, contact_source, or message (the hello@ notification is
        // the system of record for each inquiry's text).
        if (createRes.status === 409) {
          const lookupRes = await fetch(
            `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=contact_type,web_signup_source,company`,
            { headers },
          )

          const updateProperties: Record<string, string> = {}
          addUtms(updateProperties)

          if (!lookupRes.ok) {
            const text = await lookupRes.text()
            console.error('wholesale HubSpot lookup failed', lookupRes.status, text)
          } else {
            const existing = (await lookupRes.json().catch(() => ({}))) as {
              properties?: { contact_type?: string; web_signup_source?: string; company?: string }
            }
            const props = existing.properties ?? {}
            if (!props.web_signup_source) updateProperties.web_signup_source = 'Wholesale Contact Form'
            if (!props.contact_type) updateProperties.contact_type = 'Wholesale Retail Customer'
            // Treat the business bundle as a unit: fill it only when the contact
            // has no business data yet (company blank).
            if (!props.company) {
              if (company) updateProperties.company = company
              if (firstname) updateProperties.firstname = firstname
              if (lastname) updateProperties.lastname = lastname
              if (address) updateProperties.address = address
              if (city) updateProperties.city = city
              if (state) updateProperties.state = state
              if (zip) updateProperties.zip = zip
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
          console.error('wholesale HubSpot update failed', updateRes.status, text)
          return Response.json({ error: 'HubSpot update failed' }, { status: 502 })
        }

        const text = await createRes.text()
        console.error('wholesale HubSpot create failed', createRes.status, text)
        return Response.json({ error: 'HubSpot create failed' }, { status: 502 })
      },
    },
  },
})
