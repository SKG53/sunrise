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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
        <section className="c-form-section">
          <div className="container">
            <div className="c-form-card">
                {submitted ? (
                  <div className="c-success" role="status" aria-live="polite">
                    <div className="c-success-headline">Submission successful</div>
                    <p className="c-success-body">
                      Thanks for signing up. We'll be in touch with event info soon.
                    </p>
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}