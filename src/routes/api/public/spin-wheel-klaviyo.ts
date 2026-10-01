// Public spin-wheel Klaviyo write — the non-blocking Klaviyo half of the spin
// popup claim. Mirrors spin-wheel-hubspot.ts: the reward reveal is gated ONLY on
// the Supabase write (/api/public/newsletter); the front end calls THIS endpoint
// in parallel, without awaiting it. Subscribes the email to SUNRISE Subscribers
// with marketing consent, writes the deal/profile fields, and logs the
// `Claimed Deal` event. Any failure is logged and never surfaces to the user.
import { createFileRoute } from '@tanstack/react-router'
import { klaviyoClaim } from '@/lib/klaviyo.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: unknown
  popup_type?: unknown
  capture_page?: unknown
  deal_code?: unknown
  deals_offered?: unknown
  deal_date?: unknown
  ad_variant?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

const asStr = (v: unknown, max = 512) => (typeof v === 'string' && v.length <= max ? v : '')

export const Route = createFileRoute('/api/public/spin-wheel-klaviyo')({
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

        const deal_code = asStr(body.deal_code, 64)

        await klaviyoClaim({
          email,
          web_signup_source: 'Website Pop-up',
          contact_type: 'DTC Customer',
          contact_source: 'Website',
          capture_page: asStr(body.capture_page),
          popup_type: asStr(body.popup_type, 32),
          deal_code,
          deals_offered: asStr(body.deals_offered, 256),
          deal_date: asStr(body.deal_date, 32),
          ad_variant: asStr(body.ad_variant, 16),
          deal_won_code: deal_code,
          utm_source: asStr(body.utm_source),
          utm_medium: asStr(body.utm_medium),
          utm_campaign: asStr(body.utm_campaign),
          utm_content: asStr(body.utm_content),
          utm_term: asStr(body.utm_term),
          logEvent: true,
        })

        return Response.json({ success: true })
      },
    },
  },
})
