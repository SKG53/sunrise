// Public contact form endpoint — accepts unauthenticated submissions from
// the /contact page. Validates input and sends TWO emails through Lovable's
// managed email delivery:
//   1. Confirmation to the submitter
//   2. Notification to hello@savorsunrise.com
import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { sendTemplateEmail } from '@/lib/email-templates/send-email'
import { TEMPLATES } from '@/lib/email-templates/registry'

function redactEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactBody {
  name?: unknown
  email?: unknown
  reason?: unknown
  message?: unknown
  topic?: unknown
}

async function logSend(opts: {
  templateName: string
  recipientEmail: string
  status: 'sent' | 'suppressed' | 'failed'
  errorMessage?: string
}) {
  const { error } = await supabaseAdmin.from('email_send_log' as any).insert({
    template_name: opts.templateName,
    recipient_email: opts.recipientEmail,
    status: opts.status,
    error_message: opts.errorMessage ?? null,
  })
  if (error) {
    console.error('Failed to write email_send_log', {
      status: opts.status,
      template_name: opts.templateName,
      error: { code: (error as any).code, message: error.message },
    })
  }
}

async function sendOne(opts: {
  templateName: string
  recipientEmail: string
  templateData: Record<string, any>
  idempotencyKey: string
}) {
  const { templateName, recipientEmail, templateData, idempotencyKey } = opts
  const template = TEMPLATES[templateName]
  if (!template) {
    return { ok: false, error: `Unknown template ${templateName}` }
  }

  const effectiveRecipient = (template.to || recipientEmail).toLowerCase()

  try {
    const result = await sendTemplateEmail(templateName, effectiveRecipient, {
      templateData,
      idempotencyKey,
    })

    if (!result.sent) {
      await logSend({
        templateName,
        recipientEmail: effectiveRecipient,
        status: 'suppressed',
      })
      return { ok: true, suppressed: true }
    }

    await logSend({
      templateName,
      recipientEmail: effectiveRecipient,
      status: 'sent',
    })
    return { ok: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    await logSend({
      templateName,
      recipientEmail: effectiveRecipient,
      status: 'failed',
      errorMessage: errorMsg.slice(0, 1000),
    })
    return { ok: false, error: 'send_failed' }
  }
}

export const Route = createFileRoute('/api/public/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ContactBody
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        // Validate
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        const email = typeof body.email === 'string' ? body.email.trim() : ''
        const reason = typeof body.reason === 'string' ? body.reason.trim() : 'General Inquiry'
        const message = typeof body.message === 'string' ? body.message.trim() : ''

        if (!name || name.length > 200) {
          return Response.json({ error: 'Name is required (max 200 chars)' }, { status: 400 })
        }
        if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
          return Response.json({ error: 'Valid email is required' }, { status: 400 })
        }
        if (!message || message.length < 1 || message.length > 5000) {
          return Response.json({ error: 'Message is required (max 5000 chars)' }, { status: 400 })
        }
        if (reason.length > 200) {
          return Response.json({ error: 'Invalid reason' }, { status: 400 })
        }

        const submissionId = crypto.randomUUID()
        const templateData = { name, email, reason, message }

        // Fire both emails. Notification first (most important — internal alert),
        // then confirmation. Both are independent; if one fails, log and continue.
        const notify = await sendOne({
          templateName: 'contact-notification',
          recipientEmail: 'hello@savorsunrise.com',
          templateData,
          idempotencyKey: `contact-notify-${submissionId}`,
        })
        const confirm = await sendOne({
          templateName: 'contact-confirmation',
          recipientEmail: email,
          templateData,
          idempotencyKey: `contact-confirm-${submissionId}`,
        })

        if (!notify.ok && !confirm.ok) {
          console.error('Both contact emails failed to send', {
            recipient_redacted: redactEmail(email),
            notify,
            confirm,
          })
          return Response.json(
            { error: 'Failed to send. Please try again or email hello@savorsunrise.com directly.' },
            { status: 500 }
          )
        }

        if (!notify.ok || !confirm.ok) {
          console.warn('Partial contact email failure', {
            recipient_redacted: redactEmail(email),
            notify,
            confirm,
          })
        }

        return Response.json({ success: true })
      },
    },
  },
})
