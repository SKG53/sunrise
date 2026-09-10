import { createEmailWebhookHandler } from '@lovable.dev/email-js'
import { createFileRoute } from '@tanstack/react-router'

type SuppressionReason = 'bounce' | 'complaint' | 'unsubscribe'

const LOG_STATUS: Record<SuppressionReason, 'bounced' | 'complained' | 'suppressed'> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}

const LOG_MESSAGE: Record<SuppressionReason, string> = {
  bounce: 'Permanent bounce - email address is invalid or rejected',
  complaint: 'Spam complaint - recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

async function recordOutcome(
  reason: SuppressionReason,
  recipient: string,
  messageId: string | null,
  eventId: string
) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const normalizedEmail = recipient.toLowerCase()

  const { error: suppressError } = await supabaseAdmin
    .from('suppressed_emails' as any)
    .upsert({ email: normalizedEmail, reason, metadata: null }, { onConflict: 'email' })

  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: eventId,
      error: { code: (suppressError as any).code, message: suppressError.message },
    })
    throw new Error('Failed to write suppression')
  }

  const { error: insertError } = await supabaseAdmin.from('email_send_log' as any).insert({
    message_id: messageId ?? null,
    template_name: 'system',
    recipient_email: normalizedEmail,
    status: LOG_STATUS[reason],
    error_message: LOG_MESSAGE[reason],
    metadata: null,
  })

  if (insertError) {
    console.error('Failed to insert email_send_log', {
      event_id: eventId,
      error: { code: (insertError as any).code, message: insertError.message },
    })
    throw new Error('Failed to write email_send_log')
  }
}

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env['LOVABLE_API_KEY']
        if (!apiKey) {
          console.error('Missing required environment variables')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            'email.bounced': async (event) => {
              await recordOutcome(
                'bounce',
                event.data.recipient,
                (event.data as any).message_id ?? null,
                event.event_id
              )
            },
            'email.complaint': async (event) => {
              await recordOutcome(
                'complaint',
                event.data.recipient,
                (event.data as any).message_id ?? null,
                event.event_id
              )
            },
            'email.unsubscribed': async (event) => {
              await recordOutcome(
                'unsubscribe',
                event.data.recipient,
                (event.data as any).message_id ?? null,
                event.event_id
              )
            },
          },
        })
        return handler(request)
      },
    },
  },
})
