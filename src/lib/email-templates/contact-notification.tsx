import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'SUNRISE'

interface ContactNotificationProps {
  name?: string
  email?: string
  reason?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, reason, message }: ContactNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New contact form submission from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>{SITE_NAME} · Contact Form</Heading>
        <Heading style={h1}>New message</Heading>

        <Text style={label}>From</Text>
        <Text style={value}>{name || '—'}{email ? ` <${email}>` : ''}</Text>

        <Text style={label}>Reason</Text>
        <Text style={value}>{reason || 'General Inquiry'}</Text>

        <Text style={label}>Message</Text>
        <Text style={quote}>{message || '(no message body)'}</Text>

        {email && (
          <Text style={text}>
            Reply directly to this submitter at{' '}
            <a href={`mailto:${email}`} style={link}>{email}</a>.
          </Text>
        )}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) =>
    `New contact form: ${data.reason || 'General Inquiry'}${data.name ? ` — ${data.name}` : ''}`,
  displayName: 'Contact form notification (internal)',
  to: 'hello@savorsunrise.com',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    reason: 'Wholesale / Retail Partnership',
    message: 'Hi! Interested in carrying SUNRISE at our shop.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Arial, sans-serif', margin: 0, padding: 0 }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '12px', fontWeight: 800, letterSpacing: '0.25em', color: '#C4922A', textTransform: 'uppercase' as const, margin: '0 0 18px' }
const h1 = { fontSize: '24px', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.15, margin: '0 0 24px', textTransform: 'uppercase' as const }
const label = { fontSize: '11px', fontWeight: 800, letterSpacing: '0.2em', color: '#666666', textTransform: 'uppercase' as const, margin: '16px 0 4px' }
const value = { fontSize: '15px', color: '#1A1A1A', margin: '0 0 4px', fontWeight: 600 }
const text = { fontSize: '14px', color: '#333333', lineHeight: 1.6, margin: '24px 0 0' }
const quote = { fontSize: '15px', color: '#1A1A1A', lineHeight: 1.6, margin: '0 0 8px', padding: '14px 18px', borderLeft: '3px solid #CC1F39', background: '#FEFBE0', whiteSpace: 'pre-wrap' as const }
const link = { color: '#CC1F39', borderBottom: '1px solid #CC1F39', textDecoration: 'none' }
