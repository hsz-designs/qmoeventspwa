import { useState, type FormEvent } from 'react'
import { ArrowRight, CalendarCheck2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { user, signIn, resetPassword, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('student@students.national-u.edu.ph')
  const [password, setPassword] = useState('nationalian')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage(null)
    setIsSubmitting(true)
    try {
      await signIn(email, password)
      if (!remember) window.localStorage.removeItem('qmo-demo-user')
      navigate('/')
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to sign in. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    setMessage(null)
    try {
      await resetPassword(email)
      setMessage({ type: 'success', text: 'Password reset instructions have been sent to your email.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to request a reset.' })
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-showcase__orb login-showcase__orb--one" />
        <div className="login-showcase__orb login-showcase__orb--two" />
        <Brand light />
        <div className="login-showcase__content">
          <div className="login-showcase__badge"><Sparkles size={15} /> Your campus. Your growth.</div>
          <h1>Be part of what<br /><em>moves NU forward.</em></h1>
          <p>Discover meaningful QMO events, reserve your seat, and keep every achievement in one place.</p>
          <div className="login-showcase__stats">
            <div><strong>24+</strong><span>Events yearly</span></div>
            <div><strong>1.8K</strong><span>Event attendees</span></div>
            <div><strong>100%</strong><span>Digital certificates</span></div>
          </div>
        </div>
        <div className="login-showcase__footer">
          <ShieldCheck size={17} />
          <span>Official Quality Management Office events portal</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__mobile-brand"><Brand /></div>
        <div className="login-card">
          <div className="login-card__icon"><CalendarCheck2 size={25} /></div>
          <span className="eyebrow">WELCOME, NATIONALIAN</span>
          <h2>Sign in to your account</h2>
          <p>Use your NU Manila account credentials to continue.</p>

          {isDemoMode && (
            <div className="preview-notice">
              <span>Preview</span>
              Supabase isn’t connected yet. The prefilled credentials will open the demo dashboard.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Institutional email</label>
            <div className="input-wrap">
              <Mail size={18} />
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@students.national-u.edu.ph"
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="login-card__options">
              <label className="checkbox-label">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-button" onClick={handleForgotPassword}>Forgot password?</button>
            </div>

            {message && <div className={`form-message form-message--${message.type}`} role="alert">{message.text}</div>}

            <button className="button button--primary login-card__submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in to QMO Events'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-card__help">
            Need help accessing your account? <a href="mailto:qmo@national-u.edu.ph">Contact QMO support</a>
          </div>
        </div>
        <footer>© 2026 National University Manila · Quality Management Office</footer>
      </section>
    </main>
  )
}
