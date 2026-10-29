// Public checkout-identify — the cart's "where should we send your order
// updates?" step. Called fire-and-forget right before the shopper is sent to
// Shopify checkout (the email itself is also set on the Shopify cart, so
// checkout is prefilled). Upserts the Klaviyo profile with first/last name.
// Does NOT subscribe or change consent. Never blocks checkout: the client
// doesn't wait for this response.
import { createFileRoute } from '@tanstack/react-router'
import { klaviyoUpsertCheckoutProfile } from '@/lib/klaviyo.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  email?: unknown
  first_name?: unknown
  last_name?: unknown
}

const name = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 80) : '')

export const Route = createFileRoute('/api/public/checkout-identify')({
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
        await klaviyoUpsertCheckoutProfile({
          email,
          first_name: name(body.first_name),
          last_name: name(body.last_name),
        })
        return Response.json({ success: true })
      },
    },
  },
})
