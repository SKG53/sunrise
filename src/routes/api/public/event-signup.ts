// Public event signup endpoint — accepts unauthenticated submissions and
// creates/updates a contact in HubSpot via the Lovable connector gateway.
import { createFileRoute } from '@tanstack/react-router'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Body {
  name?: unknown
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  phone?: unknown
  eventName?: unknown
}

export const Route = createFileRoute('/api/public/event-signup')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY
        const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY
        if (!LOVABLE_API_KEY) {
          return Response.json({ error: 'LOVABLE_API_KEY is not configured' }, { status: 500 })
        }
        if (!HUBSPOT_API_KEY) {
          return Response.json({ error: 'HUBSPOT_API_KEY is not configured' }, { status: 500 })
        }

        let body: Body
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const firstNameInput = typeof body.firstName === 'string' ? body.firstName.trim() : ''
        const lastNameInput = typeof body.lastName === 'string' ? body.lastName.trim() : ''
        const name = typeof body.name === 'string'
          ? body.name.trim()
          : [firstNameInput, lastNameInput].filter(Boolean).join(' ')
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
        const eventName = typeof body.eventName === 'string' ? body.eventName.trim().slice(0, 200) : ''
        const referer = request.headers.get('referer')
        let refererPath = ''
        if (referer) {
          try {
            refererPath = new URL(referer).pathname.toLowerCase()
          } catch {
            refererPath = ''
          }
        }

        if (!name || name.length > 200) {
          return Response.json({ error: 'Name is required' }, { status: 400 })
        }
        if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
          return Response.json({ error: 'Valid email is required' }, { status: 400 })
        }
        if (!phone || phone.length < 5 || phone.length > 40) {
          return Response.json({ error: 'Valid phone is required' }, { status: 400 })
        }

        let firstname = firstNameInput
        let lastname = lastNameInput
        if (!firstname) {
          const [f, ...rest] = name.split(/\s+/)
          firstname = f
          if (!lastname) lastname = rest.join(' ')
        }

        const properties: Record<string, string> = {
          email,
          firstname,
          phone,
        }
        if (lastname) properties.lastname = lastname
        // Stash the event name on a standard text property so the team can
        // see which event the signup came from inside HubSpot.
        const displayedEventName = refererPath === '/hbe' ? 'Hemp Beverage Expo' : eventName
        if (displayedEventName) properties.message = `Event signup: ${displayedEventName}`
        // Tag the signup source so HubSpot smart lists (e.g.
        // "Centennial Signups – SUNRISE") can auto-populate by filter.
        // Map the form's eventName to the canonical source value HubSpot
        // filters on. Unknown events fall back to the original Centennial
        // value so existing lists keep working.
        const SOURCE_MAP: Record<string, string> = {
          'Hemp Beverage Expo': 'SUNRISE Hemp Beverage Expo',
          'SUNRISE Event': 'SUNRISE Tulsa Centennial',
        }
        properties.event_signup_source = refererPath === '/hbe'
          ? 'SUNRISE Hemp Beverage Expo'
          : SOURCE_MAP[eventName] ?? 'SUNRISE Tulsa Centennial'

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }

        // Try to create the contact first.
        const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ properties }),
        })

        if (createRes.ok) {
          return Response.json({ success: true })
        }

        // If the contact already exists (409 CONFLICT), update by email instead.
        if (createRes.status === 409) {
          const updateRes = await fetch(
            `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`,
            {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ properties }),
            },
          )
          if (updateRes.ok) {
            return Response.json({ success: true, updated: true })
          }
          const text = await updateRes.text()
          console.error('HubSpot update failed', updateRes.status, text)
          return Response.json({ error: 'Could not save your details. Please try again.' }, { status: 502 })
        }

        const text = await createRes.text()
        console.error('HubSpot create failed', createRes.status, text)
        return Response.json({ error: 'Could not save your details. Please try again.' }, { status: 502 })
      },
    },
  },
})