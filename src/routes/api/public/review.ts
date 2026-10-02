// Public review submission — POST from /submitreview.
//
// HubSpot is the system of record (no Supabase table):
//   A. contact: create, or link to the existing one (fill only blanks)
//   B. verified buyer: best-effort Klaviyo "Placed Order" lookup (runs with A)
//   C. ticket in the Product Reviews pipeline, associated to the contact —
//      THIS GATES SUCCESS: if it fails the route returns 502, the page shows
//      its error, and the reward code is never revealed
//   D. contact review-summary fields (best-effort)
//   E. Klaviyo "Review Submitted" event (best-effort)
// A review is NOT marketing consent: nothing here subscribes anyone in
// HubSpot or Klaviyo. Same connector-gateway auth as newsletter-hubspot.ts.
import { createFileRoute } from '@tanstack/react-router'
import { REVIEW_FLAVOR_LABELS } from '@/lib/reviewFlavors'
import { klaviyoHasPlacedOrder, logReviewSubmitted } from '@/lib/klaviyo.server'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/hubspot'
const EMAIL_RE = /^[^\s@"]+@[^\s@"]+\.[^\s@"]+$/
const VARIANTS = new Set(['rr1', 'rr2', 'rr3'])
const SOURCE_PAGE = '/submitreview'
const CAPTURE_PAGE = 'savorsunrise.com/submitreview'

// HubSpot IDs — Product Reviews pipeline.
const PIPELINE_ID = '0'
const STAGE_PENDING = '1'
const ASSOC_TICKET_TO_CONTACT = 16

interface FlavorIn {
  slug?: unknown
  review?: unknown
}
interface Body {
  rating?: unknown
  firstName?: unknown
  lastName?: unknown
  email?: unknown
  flavors?: unknown
  headline?: unknown
  body?: unknown
  consentToPublish?: unknown
  variant?: unknown
  order?: unknown
  company?: unknown
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const bad = (error: string) => Response.json({ error }, { status: 400 })

export const Route = createFileRoute('/api/public/review')({
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
          return bad('Invalid JSON')
        }

        // Honeypot: real visitors never fill it. Pretend success, write nothing.
        if (str(body.company)) return Response.json({ success: true })

        // ── Validation (mirrors the form) ──────────────────────────────────
        const rating = body.rating
        if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
          return bad('Rating must be 1–5')
        }
        const firstName = str(body.firstName)
        if (!firstName || firstName.length > 50) return bad('First name is required')
        const lastName = str(body.lastName)
        if (lastName.length > 40) return bad('Last name is too long')
        const email = str(body.email).toLowerCase()
        if (!email || email.length > 320 || !EMAIL_RE.test(email)) return bad('Valid email is required')
        if (body.consentToPublish !== true) return bad('Consent is required')
        const headline = str(body.headline)
        if (headline.length > 80) return bad('Headline is too long')
        const text = str(body.body)
        if (text.length < 20 || text.length > 1000) return bad('Message must be 20–1,000 characters')
        const variantRaw = str(body.variant).toLowerCase()
        if (variantRaw && !VARIANTS.has(variantRaw)) return bad('Invalid variant')
        const variant = variantRaw
        const orderRaw = str(body.order)
        const order = orderRaw.length <= 30 && /^[#0-9]*$/.test(orderRaw) ? orderRaw : ''

        if (body.flavors !== undefined && !Array.isArray(body.flavors)) return bad('Invalid flavors')
        const flavorsIn = (body.flavors ?? []) as FlavorIn[]
        if (flavorsIn.length > REVIEW_FLAVOR_LABELS.size) return bad('Too many flavors')
        const flavors: { slug: string; label: string; note: string }[] = []
        for (const f of flavorsIn) {
          const slug = str(f?.slug)
          const label = REVIEW_FLAVOR_LABELS.get(slug)
          if (!label) return bad('Unknown flavor')
          if (flavors.some((x) => x.slug === slug)) continue
          const note = str(f?.review)
          if (note.length > 500) return bad('Flavor note is too long')
          flavors.push({ slug, label, note })
        }
        const slugs = flavors.map((f) => f.slug)

        const headers = {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': HUBSPOT_API_KEY,
          'Content-Type': 'application/json',
        }
        const contactUrl = `${GATEWAY_URL}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`

        // ── A. Contact: create or link ─────────────────────────────────────
        const resolveContact = async (): Promise<string | null> => {
          const createProperties: Record<string, string> = {
            email,
            firstname: firstName,
            contact_type: 'DTC Customer',
            contact_source: 'Website',
            web_signup_source: 'Product Review',
            capture_page: CAPTURE_PAGE,
            lifecyclestage: 'lead', // create only — never on update
          }
          if (lastName) createProperties.lastname = lastName
          const createRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ properties: createProperties }),
          })
          if (createRes.ok) {
            const json = (await createRes.json().catch(() => ({}))) as { id?: string }
            return json.id ?? null
          }
          if (createRes.status !== 409) {
            console.error('review contact create failed', createRes.status, await createRes.text().catch(() => ''))
            return null
          }
          // Existing contact: fill ONLY blanks. Never touch contact_source,
          // lifecyclestage, or UTMs.
          const lookupRes = await fetch(
            `${contactUrl}&properties=contact_type,web_signup_source,capture_page,firstname,lastname`,
            { headers },
          )
          if (!lookupRes.ok) {
            console.error('review contact lookup failed', lookupRes.status, await lookupRes.text().catch(() => ''))
            return null
          }
          const existing = (await lookupRes.json().catch(() => ({}))) as {
            id?: string
            properties?: Record<string, string | null | undefined>
          }
          const p = existing.properties ?? {}
          const fill: Record<string, string> = {}
          if (!p.contact_type) fill.contact_type = 'DTC Customer'
          if (!p.web_signup_source) {
            fill.web_signup_source = 'Product Review'
            fill.capture_page = CAPTURE_PAGE
          }
          if (!p.firstname) fill.firstname = firstName
          if (!p.lastname && lastName) fill.lastname = lastName
          if (Object.keys(fill).length) {
            const upd = await fetch(contactUrl, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({ properties: fill }),
            })
            if (!upd.ok) console.error('review contact fill failed', upd.status, await upd.text().catch(() => ''))
          }
          return existing.id ?? null
        }

        // A and B run together; B never throws and defaults to false.
        const [contactId, verifiedBuyer] = await Promise.all([
          resolveContact().catch((e) => {
            console.error('review contact error', (e as Error)?.message)
            return null
          }),
          klaviyoHasPlacedOrder(email),
        ])

        // ── C. Ticket (gates success) ──────────────────────────────────────
        const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : ''
        const displayName = lastInitial ? `${firstName} ${lastInitial}.` : firstName
        const subject =
          headline || `★${rating} · ${flavors.length ? flavors[0].label : 'General review'}`
        const noteLines = flavors.filter((f) => f.note).map((f) => `${f.label}: ${f.note}`)
        const content = noteLines.length ? `${text}\n\n${noteLines.join('\n')}` : text

        const ticketProperties: Record<string, string> = {
          hs_pipeline: PIPELINE_ID,
          hs_pipeline_stage: STAGE_PENDING,
          subject,
          content,
          review_rating: String(rating),
          review_products: slugs.join('; '),
          review_display_name: displayName,
          verified_buyer: verifiedBuyer ? 'true' : 'false',
          review_source_page: SOURCE_PAGE,
        }
        if (variant) ticketProperties.review_email_variant = variant
        if (order) ticketProperties.review_order_id = order

        const ticketPayload: Record<string, unknown> = { properties: ticketProperties }
        if (contactId) {
          ticketPayload.associations = [
            {
              to: { id: contactId },
              types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: ASSOC_TICKET_TO_CONTACT }],
            },
          ]
        } else {
          console.error('review ticket created without contact association', email)
        }

        let ticketRes: Response
        try {
          ticketRes = await fetch(`${GATEWAY_URL}/crm/v3/objects/tickets`, {
            method: 'POST',
            headers,
            body: JSON.stringify(ticketPayload),
          })
        } catch (e) {
          console.error('review ticket create error', (e as Error)?.message)
          return Response.json({ error: 'Could not record review' }, { status: 502 })
        }
        if (!ticketRes.ok) {
          // 403 here usually means the HubSpot connection lacks the tickets scope.
          console.error('review ticket create failed', ticketRes.status, await ticketRes.text().catch(() => ''))
          return Response.json({ error: 'Could not record review' }, { status: 502 })
        }

        // ── D. Contact review summary (best-effort) ────────────────────────
        const updateSummary = async () => {
          if (!contactId) return
          const curRes = await fetch(`${contactUrl}&properties=review_count,all_reviewed_products`, { headers })
          const cur = curRes.ok
            ? (((await curRes.json().catch(() => ({}))) as { properties?: Record<string, string | null> })
                .properties ?? {})
            : {}
          if (!curRes.ok) console.error('review summary read failed', curRes.status)
          const prevCount = Number.parseInt(cur.review_count ?? '', 10)
          const prevProducts = (cur.all_reviewed_products ?? '')
            .split(';')
            .map((x) => x.trim())
            .filter(Boolean)
          const allProducts = [...prevProducts]
          for (const s of slugs) if (!allProducts.includes(s)) allProducts.push(s)

          const summary: Record<string, string> = {
            review_submitted: 'true',
            last_review_rating: String(rating),
            last_review_date: new Date().toISOString().slice(0, 10),
            all_reviewed_products: allProducts.join('; '),
            review_count: String((Number.isFinite(prevCount) ? prevCount : 0) + 1),
          }
          if (slugs.length) summary.last_reviewed_product = slugs.join('; ')
          const res = await fetch(contactUrl, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ properties: summary }),
          })
          if (!res.ok) console.error('review summary update failed', res.status, await res.text().catch(() => ''))
        }

        // D and E are best-effort but awaited so they complete before the
        // response ends; neither can turn a recorded review into an error.
        await Promise.all([
          updateSummary().catch((e) => console.error('review summary error', (e as Error)?.message)),
          logReviewSubmitted(email),
        ])

        return Response.json({ success: true })
      },
    },
  },
})
