// Public free can Klaviyo write — the non-blocking Klaviyo half of the "Want a
// Taste?" email gate (components/FreeSampleSection.tsx). Copy of
// newsletter-klaviyo.ts: the reveal is gated only on the Supabase write
// (/api/public/newsletter, source "free-can"); the front end calls THIS endpoint
// in parallel, without awaiting it. Subscribes the email to SUNRISE Subscribers
// with marketing consent and stamps web_signup_source = Free Can (first-capture).
// Logs ONLY the "Claimed Free Can" event (Free Can flow trigger): no Newsletter
// Signup event (that would trigger the Welcome flow) and logEvent stays false
// (Claimed Deal triggers Spin & Save).
import { createFileRoute } from '@tanstack/react-router'
import { klaviyoClaim } from '@/lib/klaviyo.server'
import { fetchHubspotFirstTouch } from '@/lib/hubspot.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Allow-lists — anything else is rejected with 400.
const FREE_CAN_CODES = new Set(['WEBFREECAN', 'FREECAN', 'TRYFREECAN'])
const FREE_CAN_SOURCES = new Set(['organic', 'meta'])

interface Body {
  email?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
  page?: unknown
  code?: unknown
  source?: unknown
}

const asStr = (v: unknown, max = 512) => (typeof v === 'string' && v.length <= max ? v : '')

export const Route = createFileRoute('/api/public/free-can-klaviyo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
        const code = typeof body.code === 'string' ? body.code : ''
        if (!FREE_CAN_CODES.has(code)) {
          return Response.json({ error: 'Invalid code' }, { status: 400 })
        }
        const source = typeof body.source === 'string' ? body.source : ''
        if (!FREE_CAN_SOURCES.has(source)) {
          return Response.json({ error: 'Invalid source' }, { status: 400 })
        }

        // HubSpot is the system of record for first-touch fields; mirror an
        // existing contact's values so the two systems agree (e.g. a Contact-form-
        // first visitor keeps web_signup_source = "Contact Form" in Klaviyo too).
        // Non-blocking: null on 404/failure → fall back to defaults.
        const hs = await fetchHubspotFirstTouch(email)

        await klaviyoClaim({
          email,
          web_signup_source: hs?.web_signup_source || 'Free Can',
          contact_type: hs?.contact_type || 'DTC Customer',
          contact_source: hs?.contact_source || 'Website',
          capture_page: hs?.capture_page,
          utm_source: hs?.utm_source || asStr(body.utm_source),
          utm_medium: hs?.utm_medium || asStr(body.utm_medium),
          utm_campaign: hs?.utm_campaign || asStr(body.utm_campaign),
          utm_content: hs?.utm_content || asStr(body.utm_content),
          utm_term: hs?.utm_term || asStr(body.utm_term),
          logEvent: false,
          // Submitting page → event only; profile capture_page stays hs-mirrored.
          // No newsletterEvent: a free can claim must not trigger the Welcome flow.
          freeCanEvent: { code, source, capture_page: asStr(body.page) || undefined },
        })

        return Response.json({ success: true })
      },
    },
  },
})
