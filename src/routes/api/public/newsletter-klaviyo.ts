// Public newsletter Klaviyo write — the non-blocking Klaviyo half of the footer
// signup. Mirrors newsletter-hubspot.ts: the footer's success state is gated only
// on the Supabase write (/api/public/newsletter); the front end calls THIS
// endpoint in parallel, without awaiting it. Subscribes the email to SUNRISE
// Subscribers with marketing consent and stamps web_signup_source = Newsletter.
// No deal fields, no capture_page, no Claimed Deal event (brief item 3).
import { createFileRoute } from '@tanstack/react-router'
import { klaviyoClaim } from '@/lib/klaviyo.server'
import { fetchHubspotFirstTouch } from '@/lib/hubspot.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

const asStr = (v: unknown, max = 512) => (typeof v === 'string' && v.length <= max ? v : '')

export const Route = createFileRoute('/api/public/newsletter-klaviyo')({
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

        // HubSpot is the system of record for first-touch fields; mirror an
        // existing contact's values so the two systems agree (e.g. a Contact-form-
        // first visitor keeps web_signup_source = "Contact Form" in Klaviyo too).
        // Non-blocking: null on 404/failure → fall back to defaults.
        const hs = await fetchHubspotFirstTouch(email)

        await klaviyoClaim({
          email,
          web_signup_source: hs?.web_signup_source || 'Newsletter',
          contact_type: hs?.contact_type || 'DTC Customer',
          contact_source: hs?.contact_source || 'Website',
          capture_page: hs?.capture_page,
          utm_source: hs?.utm_source || asStr(body.utm_source),
          utm_medium: hs?.utm_medium || asStr(body.utm_medium),
          utm_campaign: hs?.utm_campaign || asStr(body.utm_campaign),
          utm_content: hs?.utm_content || asStr(body.utm_content),
          utm_term: hs?.utm_term || asStr(body.utm_term),
          logEvent: false,
        })

        return Response.json({ success: true })
      },
    },
  },
})
