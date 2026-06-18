// Simple event signup page — collects name, email, phone and pushes the
// attendee into HubSpot via /api/public/event-signup.
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
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
import { getShopifyMapping } from '@/lib/shopifyProductMap'
import { useShopifyProduct } from '@/hooks/useShopifyProduct'
import './contact.css'
import './home.css'
import './products.css'

const EVENT_NAME = 'Hemp Beverage Expo'

// ── PRODUCTS SECTION DATA (mirrors /products page) ───────────────────────
type Cannabinoid = 'CBG' | 'CBN' | 'THCV'
type TierKey = '5' | '10' | '30' | '60'

function toSlug(tier: TierKey, flavor: { name: string; cannabinoid?: Cannabinoid }): string {
  const flavorPart = flavor.name.toLowerCase().replace(/\s+/g, '-')
  const variantSuffix = flavor.cannabinoid ? `-${flavor.cannabinoid.toLowerCase()}` : ''
  return `${tier}mg-${flavorPart}${variantSuffix}`
}

type Flavor = { name: string; descriptor: string; flavorColor: string; cannabinoid?: Cannabinoid }
type TierData = { color: string; name: string; short: string; descriptors: string; copy: string; flavors: Flavor[] }

const SHOW_NON_LIVE_PRODUCTS = false
const LIVE_SLUGS = new Set<string>([
  '10mg-strawberry','10mg-watermelon','10mg-lemonade',
  '30mg-peach-mango','30mg-cherry-limeade','30mg-orange-lemonade',
  '30mg-kiwi-watermelon-cbg','30mg-blueberry-pomegranate-cbn','30mg-strawberry-watermelon-thcv',
  '60mg-wild-cherry-peach','60mg-blueberry-lemonade','60mg-passionfruit-mango',
  '60mg-blood-orange-cbg','60mg-blackberry-cbn','60mg-strawberry-kiwi-thcv',
])

const TIERS: Record<TierKey, TierData> = {
  '5':  { color: '#DC7F27', name: 'Subtle Lift', short: 'Subtle Lift', descriptors: 'Light · Bright · Casual',
    copy: 'First times, mid-week refreshments, or social sessions. Crisp, casual, easy to like.', flavors: [] },
  '10': { color: '#CC1F39', name: 'Perfect Buzz', short: 'Perfect Buzz', descriptors: 'Smooth · Balanced · Social',
    copy: 'Casual sips, afternoon resets, or social gatherings. The go-to tier — a steady, social lift.',
    flavors: [
      { name: 'Strawberry',          descriptor: 'Fresh + Fruity',  flavorColor: '#CC1F39' },
      { name: 'Watermelon',          descriptor: 'Sweet + Juicy',   flavorColor: '#0A6034' },
      { name: 'Lemonade',            descriptor: 'Crisp + Tangy',   flavorColor: '#E0AD2C' },
      { name: 'Tangerine',           descriptor: 'Bright + Zesty',  flavorColor: '#F89A1F', cannabinoid: 'CBG' },
      { name: 'Blackberry Lemonade', descriptor: 'Tart + Bold',     flavorColor: '#2E1E3D', cannabinoid: 'CBN' },
      { name: 'Blueberry Acai',      descriptor: 'Rich + Vibrant',  flavorColor: '#21285A', cannabinoid: 'THCV' },
    ] },
  '30': { color: '#0A6034', name: 'Deeper Dive', short: 'Deeper Dive', descriptors: 'Rich · Vibrant · Spirited',
    copy: 'Extended sessions, creative inspirations, or evening unwinds. For when the mood calls for something richer.',
    flavors: [
      { name: 'Peach Mango',           descriptor: 'Lush + Tropical',   flavorColor: '#E89B5B' },
      { name: 'Cherry Limeade',        descriptor: 'Tart + Refreshing', flavorColor: '#67092A' },
      { name: 'Orange Lemonade',       descriptor: 'Bright + Tart',     flavorColor: '#FAA819' },
      { name: 'Kiwi Watermelon',       descriptor: 'Crisp + Cool',      flavorColor: '#A4BC47', cannabinoid: 'CBG' },
      { name: 'Blueberry Pomegranate', descriptor: 'Tart + Vibrant',    flavorColor: '#21285A', cannabinoid: 'CBN' },
      { name: 'Strawberry Watermelon', descriptor: 'Sweet + Fresh',     flavorColor: '#0A6034', cannabinoid: 'THCV' },
    ] },
  '60': { color: '#2E1E3D', name: 'Elevated Experience', short: 'Elevated Experience', descriptors: 'Bold · Potent · Immersive',
    copy: 'Late nights, deep decompressions, or weekend relaxation. The full expression — patience and respect required.',
    flavors: [
      { name: 'Passionfruit Mango',  descriptor: 'Bright + Breezy', flavorColor: '#60203A' },
      { name: 'Wild Cherry Peach',   descriptor: 'Lush + Juicy',    flavorColor: '#861625' },
      { name: 'Blueberry Lemonade',  descriptor: 'Rich + Tangy',    flavorColor: '#21285A' },
      { name: 'Blood Orange',        descriptor: 'Tart + Punchy',   flavorColor: '#DC7F27', cannabinoid: 'CBG' },
      { name: 'Blackberry',          descriptor: 'Dark + Smooth',   flavorColor: '#2E1E3D', cannabinoid: 'CBN' },
      { name: 'Strawberry Kiwi',     descriptor: 'Sweet + Tangy',   flavorColor: '#CC1F39', cannabinoid: 'THCV' },
    ] },
}

const LOCKUP_SIZE = 2.2

const CANNABINOID_EFFECT: Record<Cannabinoid, string> = {
  CBG: 'Focus + Uplift',
  CBN: 'Relax + Unwind',
  THCV: 'Elevate + Engage',
}

type EffectCardData = { bg: string; icon: string; cann: Cannabinoid | null; bestFor: string; body: string; foot: string }
const EFFECTS: EffectCardData[] = [
  { bg: '#1A1A1A', icon: '/images/effects/thc.svg',  cann: null,   bestFor: 'Anytime',           body: 'Full and familiar, this is the starting point for every SUNRISE experience.',  foot: 'Pure + Classic' },
  { bg: '#DC7F27', icon: '/images/effects/cbg.svg',  cann: 'CBG',  bestFor: 'Daytime',           body: 'Gently elevates the mood and experience for a subtle, clear-headed lift.',     foot: 'Focus + Uplift' },
  { bg: '#2E1E3D', icon: '/images/effects/cbn.svg',  cann: 'CBN',  bestFor: 'Nighttime',         body: 'Gently relaxes and mellows the mind for a calming overall experience.',         foot: 'Relax + Unwind' },
  { bg: '#CC1F39', icon: '/images/effects/thcv.svg', cann: 'THCV', bestFor: 'Focus & Clarity',   body: 'Leans forward with a slightly sharper lift to enhance focus and motivation.',   foot: 'Elevate + Engage' },
]

function renderEffectSymbol(cann: Cannabinoid | null, base: number, color: string): string {
  const thcWord = (sz: number) =>
    `<span style="display:inline-block; text-align:left; line-height:1">` +
    `<span style="font-family:Montserrat, sans-serif; font-size:${sz}px; font-weight:900; letter-spacing:${sz * -0.105}px; color:${color}">THC</span>` +
    `</span>`
  if (!cann) return thcWord(base)
  const t = base * 0.545
  const w = base * 0.41
  const h = base * 0.91
  const vert =
    `<span style="display:inline-block; position:relative; width:${w}px; height:${h}px; flex-shrink:0">` +
    `<span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-90deg); opacity:0.55; white-space:nowrap; line-height:1">` +
    `<span style="font-family:Montserrat, sans-serif; font-size:${t}px; font-weight:900; letter-spacing:${t * -0.105}px; color:${color}">THC</span>` +
    `</span></span>`
  const big =
    cann === 'CBG' ? renderCBGLockup(base, color) :
    cann === 'CBN' ? renderCBNLockup(base, color) :
    renderTHCVLockup(base, color)
  return vert + big
}

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

  const [activeTier, setActiveTier] = useState<TierKey>('10')

  // Refs for brand-mark painting
  const heroWmRef = useRef<HTMLDivElement>(null)
  const panelLockupRef = useRef<HTMLDivElement>(null)
  const switch5Ref = useRef<HTMLDivElement>(null)
  const switch10Ref = useRef<HTMLDivElement>(null)
  const switch30Ref = useRef<HTMLDivElement>(null)
  const switch60Ref = useRef<HTMLDivElement>(null)
  const switchRefs: Record<TierKey, RefObject<HTMLDivElement | null>> = {
    '5': switch5Ref, '10': switch10Ref, '30': switch30Ref, '60': switch60Ref,
  }
  const effectRefs = useRef<(HTMLDivElement | null)[]>([])
  const wordmarkRef = useRef<HTMLSpanElement>(null)
  const cornerRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const paint = () => {
      const base = getBasePx()
      if (heroWmRef.current) heroWmRef.current.innerHTML = renderWordmark(base * 2.8, 'cream')

      if (panelLockupRef.current) {
        const size = base * LOCKUP_SIZE
        let html = ''
        if (activeTier === '10') html = render10mgLockup(size, '#FEFBE0')
        if (activeTier === '30') html = render30mgLockup(size, '#FEFBE0')
        if (activeTier === '60') html = render60mgLockup(size, '#FEFBE0')
        panelLockupRef.current.innerHTML = html
      }

      ;(['5', '10', '30', '60'] as TierKey[])
        .filter((tier) => SHOW_NON_LIVE_PRODUCTS || tier !== '5')
        .forEach((tier) => {
          const ref = switchRefs[tier].current
          if (!ref) return
          const isActive = tier === activeTier
          const color = isActive ? '#FEFBE0' : TIERS[tier].color
          const size = base * 1.2
          let html = ''
          if (tier === '10') html = render10mgLockup(size, color)
          if (tier === '30') html = render30mgLockup(size, color)
          if (tier === '60') html = render60mgLockup(size, color)
          ref.innerHTML = html
        })

      if (wordmarkRef.current) wordmarkRef.current.innerHTML = renderWordmark(base * 1.0, 'gradient')

      EFFECTS.forEach((e, i) => {
        const ref = effectRefs.current[i]
        if (!ref) return
        ref.innerHTML = renderEffectSymbol(e.cann, base * 1.05, '#FEFBE0')
      })

      const tierData = TIERS[activeTier]
      tierData.flavors
        .filter((f) => SHOW_NON_LIVE_PRODUCTS || LIVE_SLUGS.has(toSlug(activeTier, f)))
        .forEach((f, i) => {
          const ref = cornerRefs.current[i]
          if (!ref || !f.cannabinoid) return
          const size = base * 0.91
          const html =
            f.cannabinoid === 'CBG' ? renderCBGLockup(size, '#FEFBE0') :
            f.cannabinoid === 'CBN' ? renderCBNLockup(size, '#FEFBE0') :
                                      renderTHCVLockup(size, '#FEFBE0')
          ref.innerHTML = html
        })
    }
    paint()
    if (document.fonts) document.fonts.ready.then(paint)
    window.addEventListener('resize', paint)
    return () => window.removeEventListener('resize', paint)
  }, [activeTier])

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