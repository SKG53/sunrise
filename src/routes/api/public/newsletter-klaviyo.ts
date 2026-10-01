// Public newsletter Klaviyo write — the non-blocking Klaviyo half of the footer
// signup. Mirrors newsletter-hubspot.ts: the footer's success state is gated only
// on the Supabase write (/api/public/newsletter); the front end calls THIS
// endpoint in parallel, without awaiting it. Subscribes the email to SUNRISE
// Subscribers with marketing consent and stamps web_signup_source = Newsletter.
// No deal fields, no capture_page, no Claimed Deal event (brief item 3).
import { createFileRoute } from '@tanstack/react-router'
import { klaviyoClaim } from '@/lib/klaviyo.server'

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

        await klaviyoClaim({
          email,
          web_signup_source: 'Newsletter',
          contact_type: 'DTC Customer',
          contact_source: 'Website',
          utm_source: asStr(body.utm_source),
          utm_medium: asStr(body.utm_medium),
          utm_campaign: asStr(body.utm_campaign),
          utm_content: asStr(body.utm_content),
          utm_term: asStr(body.utm_term),
          logEvent: false,
        })

        return Response.json({ success: true })
      },
    },
  },
})
