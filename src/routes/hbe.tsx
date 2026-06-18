// Simple event signup page — collects name, email, phone and pushes the
// attendee into HubSpot via /api/public/event-signup.
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import {
  renderWordmark,
  render10mgLockup,
  render30mgLockup,
  render60mgLockup,
  renderCBGLockup,
  renderCBNLockup,
  renderTHCVLockup,
  getBasePx,
} from '../lib/sunrise-components'
import './contact.css'
import './home.css'

const EVENT_NAME = 'Hemp Beverage Expo'

// ── PRODUCT GRID DATA ────────────────────────────────────────────────────
type Cannabinoid = 'CBG' | 'CBN' | 'THCV'
type TierKey = '10' | '30' | '60'
type Flavor = {
  name: string
  descriptor: string
  flavorColor: string
  cannabinoid?: Cannabinoid
  comingSoon?: boolean
}

function toSlug(tier: TierKey, f: Flavor): string {
  const base = f.name.toLowerCase().replace(/\s+/g, '-')
  const suffix = f.cannabinoid ? `-${f.cannabinoid.toLowerCase()}` : ''
  return `${tier}mg-${base}${suffix}`
}

const TIERS: { tier: TierKey; flavors: Flavor[] }[] = [
  {
    tier: '10',
    flavors: [
      { name: 'Strawberry',          descriptor: 'Fresh + Fruity', flavorColor: '#CC1F39' },
      { name: 'Watermelon',          descriptor: 'Sweet + Juicy',  flavorColor: '#0A6034' },
      { name: 'Lemonade',            descriptor: 'Crisp + Tangy',  flavorColor: '#E0AD2C' },
      { name: 'Tangerine',           descriptor: 'Bright + Zesty', flavorColor: '#F89A1F', cannabinoid: 'CBG',  comingSoon: true },
      { name: 'Blackberry Lemonade', descriptor: 'Tart + Bold',    flavorColor: '#2E1E3D', cannabinoid: 'CBN',  comingSoon: true },
      { name: 'Blueberry Acai',      descriptor: 'Rich + Vibrant', flavorColor: '#21285A', cannabinoid: 'THCV', comingSoon: true },
    ],
  },
  {
    tier: '30',
    flavors: [
      { name: 'Peach Mango',           descriptor: 'Lush + Tropical',   flavorColor: '#E89B5B' },
      { name: 'Cherry Limeade',        descriptor: 'Tart + Refreshing', flavorColor: '#67092A' },
      { name: 'Orange Lemonade',       descriptor: 'Bright + Tart',     flavorColor: '#FAA819' },
      { name: 'Kiwi Watermelon',       descriptor: 'Crisp + Cool',      flavorColor: '#A4BC47', cannabinoid: 'CBG'  },
      { name: 'Blueberry Pomegranate', descriptor: 'Tart + Vibrant',    flavorColor: '#21285A', cannabinoid: 'CBN'  },
      { name: 'Strawberry Watermelon', descriptor: 'Sweet + Fresh',     flavorColor: '#0A6034', cannabinoid: 'THCV' },
    ],
  },
  {
    tier: '60',
    flavors: [
      { name: 'Passionfruit Mango',  descriptor: 'Bright + Breezy', flavorColor: '#60203A' },
      { name: 'Wild Cherry Peach',   descriptor: 'Lush + Juicy',    flavorColor: '#861625' },
      { name: 'Blueberry Lemonade',  descriptor: 'Rich + Tangy',    flavorColor: '#21285A' },
      { name: 'Blood Orange',        descriptor: 'Tart + Punchy',   flavorColor: '#DC7F27', cannabinoid: 'CBG'  },
      { name: 'Blackberry',          descriptor: 'Dark + Smooth',   flavorColor: '#2E1E3D', cannabinoid: 'CBN'  },
      { name: 'Strawberry Kiwi',     descriptor: 'Sweet + Tangy',   flavorColor: '#CC1F39', cannabinoid: 'THCV' },
    ],
  },
]

export const Route = createFileRoute('/hbe')({
  component: EventSignupPage,
  head: () => ({
    meta: [
      { title: `${EVENT_NAME} · SUNRISE` },
      {
        name: 'description',
        content: `Visiting SUNRISE at the ${EVENT_NAME}? Drop your name, email, and phone and we'll stay in touch.`,
      },
    ],
  }),
})

function EventSignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Refs for brand-mark painting
  const heroWmRef = useRef<HTMLDivElement>(null)
  const tierLockupRefs = useRef<Record<TierKey, HTMLSpanElement | null>>({ '10': null, '30': null, '60': null })
  const cardTierRefs = useRef<Record<string, HTMLSpanElement | null>>({})
  const cardCannabinoidRefs = useRef<Record<string, HTMLSpanElement | null>>({})

  useEffect(() => {
    const paint = () => {
      const base = getBasePx()
      // Hero SUNRISE wordmark (cream, matches home page)
      if (heroWmRef.current) {
        heroWmRef.current.innerHTML = renderWordmark(base * 2.8, 'cream')
      }
      // Tier lockups (left column of each tier row) — dark text on cream bg
      const tierColor: Record<TierKey, string> = { '10': '#CC1F39', '30': '#0B6134', '60': '#61213A' }
      const lockupSize = base * 3.8
      const r10 = tierLockupRefs.current['10']
      const r30 = tierLockupRefs.current['30']
      const r60 = tierLockupRefs.current['60']
      if (r10) r10.innerHTML = render10mgLockup(lockupSize, tierColor['10'])
      if (r30) r30.innerHTML = render30mgLockup(lockupSize, tierColor['30'])
      if (r60) r60.innerHTML = render60mgLockup(lockupSize, tierColor['60'])

      // Per-card tier badge + cannabinoid strip
      const cardLockupBase = window.innerWidth <= 520 ? 28 : 44
      TIERS.forEach(({ tier, flavors }) => {
        flavors.forEach((f) => {
          const slug = toSlug(tier, f)
          const tEl = cardTierRefs.current[slug]
          if (tEl) {
            const html =
              tier === '10' ? render10mgLockup(cardLockupBase, '#FEFBE0') :
              tier === '30' ? render30mgLockup(cardLockupBase, '#FEFBE0') :
                              render60mgLockup(cardLockupBase, '#FEFBE0')
            tEl.innerHTML = html
          }
          const cEl = cardCannabinoidRefs.current[slug]
          if (cEl && f.cannabinoid) {
            const size = base * 0.91
            const html =
              f.cannabinoid === 'CBG' ? renderCBGLockup(size, '#FEFBE0') :
              f.cannabinoid === 'CBN' ? renderCBNLockup(size, '#FEFBE0') :
                                        renderTHCVLockup(size, '#FEFBE0')
            cEl.innerHTML = html
          }
        })
      })
    }
    paint()
    if (document.fonts) document.fonts.ready.then(paint)
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!firstName.trim()) next.firstName = 'First name needed.'
    if (!lastName.trim()) next.lastName = 'Last name needed.'
    if (!email.trim()) next.email = 'Email needed.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Email looks off.'
    if (!phone.trim()) next.phone = 'Phone needed.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/public/event-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          details: details.trim(),
          eventName: EVENT_NAME,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `Request failed (${res.status})`)
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main>
        {/* ── HERO — matches home page (4 tier strips + wordmark + subtitle) */}
        <section className="home-hero">
          <div className="hero-strip">
            <div className="hero-strip-col tier-5-bg" />
            <div className="hero-strip-col tier-10-bg" />
            <div className="hero-strip-col tier-30-bg" />
            <div className="hero-strip-col tier-60-bg" />
          </div>
          <div className="hero-overlay">
            <h1 className="sr-only">SUNRISE — Hemp Beverage Expo</h1>
            <div className="hero-wordmark-slot" ref={heroWmRef} />
            <div className="hero-subtitle">Crafted Beverages</div>
          </div>
        </section>

        <section className="c-form-section">
          <div className="container">
            <div className="es-top-heading">
              <div className="es-top-heading-line1">VISIT US AT THE HEMP BEVERAGE EXPO</div>
            </div>
            <div className="c-form-card">
                {submitted ? (
                  <div className="c-success es-success" role="status" aria-live="polite">
                    <div className="c-success-headline es-success-headline">Thanks for stopping by!</div>
                    <div className="es-success-cta">Explore our lineup below.</div>
                  </div>
                ) : (
                  <form className="c-form" onSubmit={handleSubmit} noValidate>
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">First Name</span>
                        <input
                          type="text"
                          className={`c-input${errors.firstName ? ' c-input-error' : ''}`}
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value)
                            if (errors.firstName) setErrors({ ...errors, firstName: undefined })
                          }}
                          required
                          autoComplete="given-name"
                          aria-invalid={errors.firstName ? true : undefined}
                        />
                        {errors.firstName && <span className="c-field-error">{errors.firstName}</span>}
                      </label>
                    </div>

                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Last Name</span>
                        <input
                          type="text"
                          className={`c-input${errors.lastName ? ' c-input-error' : ''}`}
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value)
                            if (errors.lastName) setErrors({ ...errors, lastName: undefined })
                          }}
                          required
                          autoComplete="family-name"
                          aria-invalid={errors.lastName ? true : undefined}
                        />
                        {errors.lastName && <span className="c-field-error">{errors.lastName}</span>}
                      </label>
                    </div>

                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Email</span>
                        <input
                          type="email"
                          className={`c-input${errors.email ? ' c-input-error' : ''}`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (errors.email) setErrors({ ...errors, email: undefined })
                          }}
                          required
                          autoComplete="email"
                          aria-invalid={errors.email ? true : undefined}
                        />
                        {errors.email && <span className="c-field-error">{errors.email}</span>}
                      </label>
                    </div>

                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Phone</span>
                        <input
                          type="tel"
                          className={`c-input${errors.phone ? ' c-input-error' : ''}`}
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value)
                            if (errors.phone) setErrors({ ...errors, phone: undefined })
                          }}
                          required
                          autoComplete="tel"
                          aria-invalid={errors.phone ? true : undefined}
                        />
                        {errors.phone && <span className="c-field-error">{errors.phone}</span>}
                      </label>
                    </div>

                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Additional Details</span>
                        <textarea
                          className="c-input"
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          rows={4}
                          maxLength={2000}
                          placeholder="Business name, role (wholesaler, retailer, distributor), or anything else you'd like us to know."
                        />
                      </label>
                    </div>

                    <div className="c-form-submit">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Sending…' : 'Submit'}
                      </button>
                      {submitError && (
                        <span
                          className="c-field-error"
                          role="alert"
                          style={{ display: 'block', marginTop: '0.5rem' }}
                        >
                          {submitError}
                        </span>
                      )}
                    </div>
                  </form>
                )}
            </div>

            {/* ── PRODUCTS SECTION ──────────────────────────────────── */}
            <h2 className="es-products-heading">OUR PRODUCTS</h2>
            <div className="es-products">
              {TIERS.map(({ tier, flavors }) => (
                <div key={tier} className="es-tier-row">
                  <div className="es-tier-lockup-col">
                    <span
                      className="es-tier-lockup"
                      ref={(el) => { tierLockupRefs.current[tier] = el }}
                      aria-label={`${tier} milligram THC`}
                    />
                  </div>
                  <div className="es-card-grid">
                    {flavors.map((f) => {
                      const slug = toSlug(tier, f)
                      const inner = (
                        <>
                          <div className="es-card-can" style={{ background: f.flavorColor }}>
                            <img
                              src={`/images/cans/${slug}.webp`}
                              alt={`SUNRISE ${f.name} ${tier}mg hemp-infused THC${f.cannabinoid ? ` + ${f.cannabinoid}` : ""} seltzer can`}
                              width="960"
                              height="1920"
                              loading="lazy"
                            />
                            <span
                              className="es-card-tier"
                              ref={(el) => { cardTierRefs.current[slug] = el }}
                              aria-hidden="true"
                            />
                            {f.cannabinoid && (
                              <span
                                className="es-card-cannabinoid"
                                ref={(el) => { cardCannabinoidRefs.current[slug] = el }}
                                aria-label={`+${f.cannabinoid}`}
                              />
                            )}
                          </div>
                          {f.comingSoon && (
                            <div className="es-coming-soon-row" style={{ borderColor: f.flavorColor }}>
                              <span className="es-coming-soon-badge" style={{ color: f.flavorColor, borderColor: f.flavorColor }}>
                                Coming Soon
                              </span>
                            </div>
                          )}
                          <div className="es-card-meta">
                            <div className="es-card-meta-text">
                              <div className="es-card-name">{f.name}</div>
                              <div className="es-card-descriptor" style={{ color: f.flavorColor }}>
                                {f.descriptor}
                              </div>
                            </div>
                            {!f.comingSoon && (
                              <span
                                className="es-card-shop"
                                style={{ background: f.flavorColor }}
                              >
                                Shop
                              </span>
                            )}
                          </div>
                        </>
                      )
                      return (
                        <div
                          key={slug}
                          className={`es-card${f.comingSoon ? ' es-card-coming-soon' : ''}`}
                          style={{ borderColor: f.flavorColor }}
                        >
                          {f.comingSoon ? (
                            inner
                          ) : (
                            <Link to="/products/$slug" params={{ slug }} className="es-card-link">
                              {inner}
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}