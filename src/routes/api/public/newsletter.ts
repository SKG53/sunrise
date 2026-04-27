// Public newsletter signup endpoint — captures footer email submissions.
// No confirmation/welcome email is sent (templates not built yet); just
// stores the address. Idempotent: duplicate emails return success silently.
import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface NewsletterBody {
  email?: unknown
  source?: unknown
}

export const Route = createFileRoute('/api/public/newsletter')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: NewsletterBody
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const email =
          typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const source =
          typeof body.source === 'string' && body.source.trim().length <= 64
            ? body.source.trim()
            : 'footer'

        if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
          return Response.json(
            { error: 'Please enter a valid email address.' },
            { status: 400 }
          )
        }

        const { error } = await supabaseAdmin
          .from('newsletter_subscribers' as any)
          .insert({ email, source })

        // 23505 = unique_violation → already subscribed; treat as success.
        if (error && (error as any).code !== '23505') {
          console.error('newsletter_subscribe_failed', { code: (error as any).code })
          return Response.json(
            { error: 'Could not save your email. Please try again.' },
            { status: 500 }
          )
        }

        return Response.json({ success: true })
      },
    },
  },
})
