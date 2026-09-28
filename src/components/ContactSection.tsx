import { useState, type FormEvent } from 'react'
import { useAnimateOnScroll } from '../composables/useAnimateOnScroll'

const email = 'jessicargomez.work@gmail.com'
const WEB3FORMS_ACCESS_KEY = '7144ebf2-152d-472d-a4f9-26751bc2805b'

type FormStatus = 'idle' | 'sending' | 'success' | 'error'

export default function ContactSection() {
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()
    setFormStatus('sending')
    try {
      // Sent as FormData (not JSON) so the request stays a CORS "simple request" —
      // Web3Forms doesn't return CORS headers on the JSON preflight, which makes a
      // JSON fetch fail with a CORS error in the browser regardless of the access key.
      const formData = new FormData()
      formData.append('access_key', WEB3FORMS_ACCESS_KEY)
      formData.append('subject', `Portfolio contact from ${form.name}`)
      formData.append('name', form.name)
      formData.append('email', form.email)
      formData.append('message', form.message)

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        setFormStatus('success')
        setForm({ name: '', email: '', message: '' })
      } else {
        setFormStatus('error')
      }
    } catch {
      setFormStatus('error')
    }
  }

  const { target, isVisible } = useAnimateOnScroll<HTMLElement>()

  return (
    <section id="contact" ref={target} className={`section contact ${isVisible ? 'animate-in' : ''}`}>
      <h2 className="section-title">
        <span className="title-num">06.</span> Contact
      </h2>
      <div className="contact-content">
        <p className="section-kicker">Let's build something reliable and useful.</p>
        <h3>Looking for a frontend developer who understands both product and delivery?</h3>
        <p>
          I'm open to frontend development, project coordination, and collaborative opportunities. Tell me about your
          team or the problem you're solving.
        </p>
        <form className="contact-form" onSubmit={submitForm}>
          <div className="contact-form-row">
            <label className="sr-only" htmlFor="contact-name">
              Your name
            </label>
            <input
              id="contact-name"
              className="form-input"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <label className="sr-only" htmlFor="contact-email">
              Your email
            </label>
            <input
              id="contact-email"
              className="form-input"
              type="email"
              placeholder="Your email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <label className="sr-only" htmlFor="contact-message">
            Your message
          </label>
          <textarea
            id="contact-message"
            className="form-input form-textarea"
            placeholder="Tell me about your team or the problem you're solving."
            rows={4}
            required
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          ></textarea>
          <div className="contact-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={formStatus === 'sending'}>
              {formStatus === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <button type="button" className="btn btn-outline btn-lg" onClick={copyEmail}>
              {copied ? 'Email copied!' : 'Copy email'}
            </button>
          </div>
          {formStatus === 'success' && (
            <p className="form-status form-status--success" role="status">
              Thanks! Your message has been sent — I'll get back to you soon.
            </p>
          )}
          {formStatus === 'error' && (
            <p className="form-status form-status--error" role="alert">
              Something went wrong sending that. Please try again or email me directly at {email}.
            </p>
          )}
        </form>
        <div className="contact-meta">
          <span>
            <span className="status-dot"></span> Open to opportunities
          </span>
          <span>Pampanga, Philippines · UTC+8</span>
        </div>
        <div className="contact-links">
          <a href="https://github.com/jessrgomez" target="_blank" rel="noopener noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href={`mailto:${email}`}>
            Email <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
