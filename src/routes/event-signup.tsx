// Simple event signup page — collects name, email, phone and pushes the
// attendee into HubSpot via /api/public/event-signup.
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import { SiteFooter } from '../components/SiteFooter'
import './contact.css'

const EVENT_NAME = 'SUNRISE Event'

export const Route = createFileRoute('/event-signup')({
  component: EventSignupPage,
  head: () => ({
    meta: [
      { title: `${EVENT_NAME} · Sign Up` },
      {
        name: 'description',
        content: `RSVP for ${EVENT_NAME}. Drop your name, email, and phone and we'll be in touch.`,
      },
    ],
  }),
})

function EventSignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Name needed.'
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
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
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
        <section className="c-pagehero">
          <h1 className="c-pagehero-title" aria-label="Event Signup">
            {'Event Signup'.split('').map((ch, i) => (
              <span key={i} aria-hidden="true">{ch === ' ' ? '\u00A0' : ch}</span>
            ))}
          </h1>
        </section>

        <section className="c-hero">
          <div className="container">
            <div className="c-hero-inner">
              <h1 className="c-hero-headline">
                Save your <em className="accent-italic">spot</em>
              </h1>
              <p className="c-hero-body">
                Drop your details below and we'll send updates about {EVENT_NAME}.
              </p>
            </div>
          </div>
        </section>

        <section className="c-form-section">
          <div className="container">
            <div className="c-form-grid">
              <div className="c-form-side">
                <div className="c-eyebrow">Event RSVP</div>
                <h2 className="c-form-headline">
                  Tell us who's <span className="accent">coming</span>
                </h2>
                <p className="c-form-sub">
                  Your info goes straight to our team. We'll never share it.
                </p>
              </div>

              <div className="c-form-card">
                {submitted ? (
                  <div className="c-success" role="status" aria-live="polite">
                    <div className="c-success-eyebrow">You're In</div>
                    <div className="c-success-headline">Thanks for signing up</div>
                    <p className="c-success-body">
                      We've got your details and will be in touch with event info soon.
                    </p>
                    <div className="c-success-ctas">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setSubmitted(false)
                          setName('')
                          setEmail('')
                          setPhone('')
                          setErrors({})
                        }}
                      >
                        Sign Up Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="c-form" onSubmit={handleSubmit} noValidate>
                    <div className="c-form-row">
                      <label className="c-field">
                        <span className="c-field-label">Name</span>
                        <input
                          type="text"
                          className={`c-input${errors.name ? ' c-input-error' : ''}`}
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value)
                            if (errors.name) setErrors({ ...errors, name: undefined })
                          }}
                          required
                          autoComplete="name"
                          aria-invalid={errors.name ? true : undefined}
                        />
                        {errors.name && <span className="c-field-error">{errors.name}</span>}
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

                    <div className="c-form-submit">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Sending…' : 'Sign Me Up'}
                      </button>
                      <span className="c-form-note">We'll never share your information.</span>
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
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}