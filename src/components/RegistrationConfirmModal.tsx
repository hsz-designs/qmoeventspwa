import { CalendarDays, Check, CheckCircle2, Clock3, MapPin, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { QmoEvent, QmoEventSession } from '../types'
import { formatEventDate, formatEventDates } from './EventCard'

interface RegistrationConfirmModalProps {
  event: QmoEvent | null
  sessions: QmoEventSession[]
  registeredSessionIds: Set<string>
  busy: boolean
  error?: string | null
  onClose: () => void
  onConfirm: (sessionIds: string[]) => void
}

export function RegistrationConfirmModal({ event, sessions, registeredSessionIds, busy, error, onClose, onConfirm }: RegistrationConfirmModalProps) {
  const [registrationMode, setRegistrationMode] = useState<'all' | 'manual'>('all')
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!event) return

    setRegistrationMode('all')
    setSelectedSessionIds(new Set(sessions.filter((session) => !registeredSessionIds.has(session.id)).map((session) => session.id)))
  }, [event?.id])

  useEffect(() => {
    if (!event) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [event, busy, onClose])

  if (!event) return null

  const seatsLeft = Math.max(event.capacity - event.registered, 0)
  const sessionDates = event.sessionDates?.length ? event.sessionDates : [event.date]
  const firstDate = new Date(`${sessionDates[0]}T00:00:00`)
  const availableSessionIds = sessions.filter((session) => !registeredSessionIds.has(session.id)).map((session) => session.id)
  const sessionsToRegister = registrationMode === 'all' ? availableSessionIds : availableSessionIds.filter((id) => selectedSessionIds.has(id))
  const hasMultipleSessions = sessions.length > 1

  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((current) => {
      const next = new Set(current)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && !busy && onClose()}>
      <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-modal-title">
        <button className="modal-close" type="button" onClick={onClose} disabled={busy} aria-label="Close registration confirmation">
          <X size={20} />
        </button>

        <div className="registration-modal__icon"><ShieldCheck size={27} /></div>
        <span className="registration-modal__eyebrow">CONFIRM YOUR SEAT</span>
        <h2 id="registration-modal-title">Register for this event?</h2>
        <p>Review the event details before confirming your registration.</p>

        <div className="registration-modal__event">
          <span className={`registration-modal__date tone-${event.imageTone}`}>
            <strong>{firstDate.getDate()}</strong>
            <small>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(firstDate)}{sessionDates.length > 1 ? ` +${sessionDates.length - 1}` : ''}</small>
          </span>
          <div><small>{event.category}</small><strong>{event.title}</strong></div>
        </div>

        <div className="registration-modal__details">
          <span><CalendarDays size={16} /><span><small>{sessionDates.length === 1 ? 'Date' : 'Dates'}</small><strong>{formatEventDates(sessionDates)}</strong></span></span>
          <span><Clock3 size={16} /><span><small>Time</small><strong>{event.time}</strong></span></span>
          <span><MapPin size={16} /><span><small>Venue</small><strong>{event.venue}</strong></span></span>
          <span><Users size={16} /><span><small>Availability</small><strong>{seatsLeft} seats remaining</strong></span></span>
        </div>

        {hasMultipleSessions ? (
          <fieldset className="registration-modal__mode" disabled={busy}>
            <legend>Registration preference</legend>
            <label className={registrationMode === 'all' ? 'selected' : ''}>
              <input type="radio" name="registration-mode" value="all" checked={registrationMode === 'all'} onChange={() => setRegistrationMode('all')} />
              <span><strong>Register for all sessions</strong><small>Reserve every session under this event.</small></span>
            </label>
            <label className={registrationMode === 'manual' ? 'selected' : ''}>
              <input type="radio" name="registration-mode" value="manual" checked={registrationMode === 'manual'} onChange={() => setRegistrationMode('manual')} />
              <span><strong>Choose sessions manually</strong><small>Select only the sessions you plan to attend.</small></span>
            </label>
          </fieldset>
        ) : null}

        {sessions.length ? (
          <div className="registration-modal__sessions">
            <div><strong>Event sessions</strong><small>{sessions.length} session{sessions.length === 1 ? '' : 's'}</small></div>
            <div className="registration-modal__session-list">
              {sessions.map((session) => {
                const alreadyRegistered = registeredSessionIds.has(session.id)
                const checked = alreadyRegistered || registrationMode === 'all' || selectedSessionIds.has(session.id)
                return (
                  <label className={checked ? 'selected' : ''} key={session.id}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={busy || alreadyRegistered || registrationMode === 'all'}
                      onChange={() => toggleSession(session.id)}
                    />
                    <span>
                      <strong>{session.title}</strong>
                      <small>{formatEventDate(session.date)} · {session.time}</small>
                      <small><MapPin size={12} /> {session.venue}</small>
                    </span>
                    {alreadyRegistered ? <em><Check size={12} /> Registered</em> : null}
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        {error ? <div className="registration-modal__error" role="alert">{error}</div> : null}

        <div className="registration-modal__actions">
          <button className="button button--ghost" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="button button--primary" type="button" onClick={() => onConfirm(sessionsToRegister)} disabled={busy || seatsLeft === 0 || (sessions.length > 0 && sessionsToRegister.length === 0)} autoFocus>
            <CheckCircle2 size={17} /> {busy ? 'Confirming…' : seatsLeft === 0 ? 'Event is full' : `Register${sessionsToRegister.length > 1 ? ` for ${sessionsToRegister.length} sessions` : ''}`}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
