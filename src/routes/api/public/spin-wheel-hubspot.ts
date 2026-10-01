// Public spin-wheel HubSpot write — the non-blocking, secondary half of the
// spin-the-wheel popup dual-write. The wheel's discount-code reveal is gated
// ONLY on the Supabase write (/api/public/newsletter); the front end calls THIS
// endpoint in parallel, without awaiting it, purely to sync the lead into
// HubSpot. A failure or slowdown here can never delay or block the reward.
//
// Clones the connector-gateway auth/create-or-update pattern from event-signup.ts
// — same gateway, same keys, no new integration.
//
// Write rules (brief):
//   new contact      — set everything (contact_type, contact_source,
//                      web_signup_source, lifecyclestage, utm_*, deal fields,
//                      deals_won = this code)
//   existing contact — contact_type / web_signup_source / capture_page set ONLY
//                      if blank; contact_source and lifecyclestage never touched;
//                      popup_type / deal_code / deals_offered / deal_date /
//                      ad_variant overwritten; deals_won read-modify-write.
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
  popup_type?: unknown
  capture_page?: unknown
  deal_code?: unknown
  deals_offered?: unknown
  deal_date?: unknown
  ad_variant?: unknown
}

export const Route = createFileRoute('/api/public/spin-wheel-hubspot')({
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

        // Length-guarded string passthrough.
        const asStr = (v: unknown, max = 512) => (typeof v === 'string' && v.length <= max ? v : '')
        const utm_source = asStr(body.utm_source)
        const utm_medium = asStr(body.utm_medium)
        const utm_campaign = asStr(body.utm_campaign)
        const utm_content = asStr(body.utm_content)
        const utm_term = asStr(body.utm_term)
        const popup_type = asStr(body.popup_type, 32)
        const capture_page = asStr(body.capture_page)
        const deal_code = asStr(body.deal_code, 64)
        const deals_offered = asStr(body.deals_offered, 256)
        const deal_date = asStr(body.deal_date, 32)
        const ad_variant = asStr(body.ad_variant, 16)

        const addUtms = (p: Record<string, string>) => {
          if (utm_source) p.utm_source = utm_source
          if (utm_medium) p.utm_medium = utm_medium
          if (utm_campaign) p.utm_campaign = utm_campaign
          if (utm_content) p.utm_content = utm_content
          if (utm_term) p.utm_term = utm_term
        }
        // Latest-claim fields — overwritten on every claim in both create + update.
        const addOverwriteDeal = (p: Record<string, string>) => {
          if (popup_type) p.popup_type = popup_type
          if (deal_code) p.deal_code = deal_code
          if (deals_offered) p.deals_offered = deals_offered
          if (deal_date) p.deal_date = deal_date
          if (ad_variant) p.ad_variant = ad_variant
        }

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }

        // CREATE path — full classification for a brand-new contact.
        // lifecyclestage is stamped HERE ONLY, never on update, so a returning
        // customer who spins the wheel is never regressed to a lead.
        const createProperties: Record<string, string> = {
          email,
          contact_type: 'DTC Customer',
          contact_source: 'Website',
          web_signup_source: 'Website Pop-up',
          lifecyclestage: 'lead',
        }
        addUtms(createProperties)
        if (capture_page) createProperties.capture_page = capture_page
        addOverwriteDeal(createProperties)
        if (deal_code) createProperties.deals_won = deal_code

        const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ properties: createProperties }),
        })

        if (createRes.ok) {
          return Response.json({ success: true, created: true })
        }

        // UPDATE path (409 = contact already exists, deduped on email).
        if (createRes.status === 409) {
          // One widened lookup feeds every only-if-blank decision plus the
          // deals_won read-modify-write (brief item 2 + item 5).
          const lookupRes = await fetch(
            `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=contact_type,web_signup_source,capture_page,deals_won`,
            { headers },
          )

          const updateProperties: Record<string, string> = {}
          // Overwrite fields are always safe to write and do not depend on the
          // lookup, so stamp them even if the lookup failed.
          addUtms(updateProperties)
          addOverwriteDeal(updateProperties)

          if (!lookupRes.ok) {
            // Can't confirm what's blank or read the current deals_won — write
            // only the overwrite fields rather than risk clobbering a source or
            // corrupting the running deals_won list.
            const text = await lookupRes.text()
            console.error('spin-wheel HubSpot lookup failed', lookupRes.status, text)
          } else {
            const existing = (await lookupRes.json().catch(() => ({}))) as {
              properties?: {
                contact_type?: string
                web_signup_source?: string
                capture_page?: string
                deals_won?: string
              }
            }
            const props = existing.properties ?? {}
            // Fill-if-blank (never relabel/clobber a first-touch value).
            if (!props.contact_type) updateProperties.contact_type = 'DTC Customer'
            if (!props.web_signup_source) updateProperties.web_signup_source = 'Website Pop-up'
            if (!props.capture_page && capture_page) updateProperties.capture_page = capture_page
            // deals_won read-modify-write: append this code if absent.
            if (deal_code) {
              const cur = typeof props.deals_won === 'string' ? props.deals_won : ''
              const list = cur ? cur.split(',').map((s) => s.trim()).filter(Boolean) : []
              if (!list.includes(deal_code)) list.push(deal_code)
              updateProperties.deals_won = list.join(', ')
            }
          }

          if (Object.keys(updateProperties).length === 0) {
            return Response.json({ success: true, updated: false })
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
          console.error('spin-wheel HubSpot update failed', updateRes.status, text)
          return Response.json({ error: 'HubSpot update failed' }, { status: 502 })
        }

        const text = await createRes.text()
        console.error('spin-wheel HubSpot create failed', createRes.status, text)
        return Response.json({ error: 'HubSpot create failed' }, { status: 502 })
      },
    },
  },
})
