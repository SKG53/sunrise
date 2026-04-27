import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'SUNRISE'

interface ContactConfirmationProps {
  name?: string
  reason?: string
  message?: string
}

const ContactConfirmationEmail = ({ name, reason, message }: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thanks for reaching out to {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>{SITE_NAME}</Heading>
        <Heading style={h1}>
          {name ? `Thanks, ${name}.` : 'Thanks for reaching out.'}
        </Heading>
        <Text style={text}>
          We've received your note and will be in touch within two business
          days. In the meantime, feel free to explore the lineup at{' '}
          <a href="https://www.savorsunrise.com" style={link}>savorsunrise.com</a>.
        </Text>
        {(reason || message) && (
          <>
            <Text style={label}>Your message</Text>
            {reason && <Text style={metaLine}><strong>Reason:</strong> {reason}</Text>}
            {message && <Text style={quote}>{message}</Text>}
          </>
        )}
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'Thanks for reaching out to SUNRISE',
  displayName: 'Contact form confirmation',
  previewData: {
    name: 'Jane',
    reason: 'General Inquiry',
    message: 'Just saying hi — love the brand!',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Montserrat, Arial, sans-serif', margin: 0, padding: 0 }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '14px', fontWeight: 800, letterSpacing: '0.25em', color: '#C4922A', textTransform: 'uppercase' as const, margin: '0 0 24px' }
const h1 = { fontSize: '26px', fontWeight: 900, color: '#1A1A1A', lineHeight: 1.15, margin: '0 0 18px', textTransform: 'uppercase' as const }
const text = { fontSize: '15px', color: '#333333', lineHeight: 1.6, margin: '0 0 20px' }
const label = { fontSize: '12px', fontWeight: 800, letterSpacing: '0.18em', color: '#1A1A1A', textTransform: 'uppercase' as const, margin: '24px 0 8px' }
const metaLine = { fontSize: '14px', color: '#333333', margin: '0 0 8px' }
const quote = { fontSize: '14px', color: '#333333', lineHeight: 1.55, margin: '0 0 8px', padding: '12px 16px', borderLeft: '3px solid #C4922A', background: '#FEFBE0', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '13px', color: '#666666', margin: '32px 0 0' }
const link = { color: '#1A1A1A', borderBottom: '1px solid #1A1A1A', textDecoration: 'none' }
