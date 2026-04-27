// Public contact form endpoint — accepts unauthenticated submissions from
// the /contact page. Validates input, records the submission as a pending
// log entry, and enqueues TWO emails through the Lovable email queue:
//   1. Confirmation to the submitter
//   2. Notification to hello@savorsunrise.com
//
// We bypass the auth-gated /lovable/email/transactional/send route because
// the submitter is not logged in, and we replicate its enqueue logic here
// using the service role key (admin client). Suppression check still runs.
import * as React from 'react'
import { render } from '@react-email/components'
import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'SUNRISE'
const SENDER_DOMAIN = 'notify.www.savorsunrise.com'
const FROM_DOMAIN = 'notify.www.savorsunrise.com'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

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

async function enqueueOne(opts: {
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

  // Resolve effective recipient (template `to` wins for fixed-recipient templates)
  const effectiveRecipient = (template.to || recipientEmail).toLowerCase()
  const messageId = crypto.randomUUID()

  // Suppression check
  const { data: suppressed, error: suppressionError } = await supabaseAdmin
    .from('suppressed_emails' as any)
    .select('id')
    .eq('email', effectiveRecipient)
    .maybeSingle()
  if (suppressionError) {
    return { ok: false, error: 'suppression_check_failed' }
  }
  if (suppressed) {
    await supabaseAdmin.from('email_send_log' as any).insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })
    return { ok: true, suppressed: true }
  }

  // Get or create unsubscribe token
  let unsubscribeToken: string
  const { data: existingToken } = await supabaseAdmin
    .from('email_unsubscribe_tokens' as any)
    .select('token, used_at')
    .eq('email', effectiveRecipient)
    .maybeSingle()
  if (existingToken && !(existingToken as any).used_at) {
    unsubscribeToken = (existingToken as any).token
  } else {
    unsubscribeToken = generateToken()
    await supabaseAdmin
      .from('email_unsubscribe_tokens' as any)
      .upsert(
        { token: unsubscribeToken, email: effectiveRecipient },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    const { data: stored } = await supabaseAdmin
      .from('email_unsubscribe_tokens' as any)
      .select('token')
      .eq('email', effectiveRecipient)
      .maybeSingle()
    if (stored) unsubscribeToken = (stored as any).token
  }

  // Render
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  // Pending log
  await supabaseAdmin.from('email_send_log' as any).insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email' as any, {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      text,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    await supabaseAdmin.from('email_send_log' as any).insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })
    return { ok: false, error: 'enqueue_failed' }
  }
  return { ok: true, messageId }
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
        const notify = await enqueueOne({
          templateName: 'contact-notification',
          recipientEmail: 'hello@savorsunrise.com',
          templateData,
          idempotencyKey: `contact-notify-${submissionId}`,
        })
        const confirm = await enqueueOne({
          templateName: 'contact-confirmation',
          recipientEmail: email,
          templateData,
          idempotencyKey: `contact-confirm-${submissionId}`,
        })

        if (!notify.ok && !confirm.ok) {
          console.error('Both contact emails failed to enqueue', {
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
