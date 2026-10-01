// Public deal-claim log — inserts one row into Supabase `deal_claims` for every
// spin/ad claim (brief item 6). Called fire-and-forget from the client, OFF the
// reward gate: only /api/public/newsletter (newsletter_subscribers) gates the
// code reveal, so a failure here never blocks or errors the user. Insert-only;
// the table has no public read. Temporary — removed when Supabase is retired.
import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: unknown
  deal_code?: unknown
  deals_offered?: unknown
  popup_type?: unknown
  capture_page?: unknown
  ad_variant?: unknown
  utm_source?: unknown
  utm_medium?: unknown
  utm_campaign?: unknown
  utm_content?: unknown
  utm_term?: unknown
}

const asStr = (v: unknown, max = 512) =>
  typeof v === 'string' && v.length <= max && v.length > 0 ? v : null

export const Route = createFileRoute('/api/public/deal-claim')({
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

        const row = {
          email,
          deal_code: asStr(body.deal_code, 64),
          deals_offered: asStr(body.deals_offered, 256),
          popup_type: asStr(body.popup_type, 32),
          capture_page: asStr(body.capture_page),
          ad_variant: asStr(body.ad_variant, 16),
          utm_source: asStr(body.utm_source),
          utm_medium: asStr(body.utm_medium),
          utm_campaign: asStr(body.utm_campaign),
          utm_content: asStr(body.utm_content),
          utm_term: asStr(body.utm_term),
        }

        const { error } = await supabaseAdmin.from('deal_claims' as any).insert(row)
        if (error) {
          console.error('deal_claim_insert_failed', { code: (error as any).code })
          return Response.json({ error: 'insert failed' }, { status: 500 })
        }

        return Response.json({ success: true })
      },
    },
  },
})
