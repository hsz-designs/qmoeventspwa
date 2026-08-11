import { AlertCircle, CheckCircle2, ScanLine, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EventCard } from '../components/EventCard'
import { PageHeader } from '../components/PageHeader'
import { RegistrationConfirmModal } from '../components/RegistrationConfirmModal'
import { useEventData } from '../context/EventContext'
import { findEventByQrValue } from '../lib/eventQr'

export function ScannedEventRegistrationPage() {
  const [searchParams] = useSearchParams()
  const scannedCode = searchParams.get('code')?.trim() ?? ''
  const { events, sessions, registeredIds, registeredSessionIds, registerForEvent, isLoading } = useEventData()
  const scannedEvent = useMemo(() => findEventByQrValue(events, scannedCode), [events, scannedCode])
  const eventSessions = useMemo(() => sessions.filter((session) => session.eventId === scannedEvent?.id), [sessions, scannedEvent?.id])
  const alreadyRegistered = Boolean(scannedEvent && registeredIds.has(scannedEvent.id))
  const [modalOpen, setModalOpen] = useState(false)
  const [promptedCode, setPromptedCode] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)

  useEffect(() => {
    if (!scannedEvent || alreadyRegistered || promptedCode === scannedCode) return
    setPromptedCode(scannedCode)
    setModalOpen(true)
  }, [alreadyRegistered, promptedCode, scannedCode, scannedEvent])

  const confirmRegistration = async (sessionIds: string[]) => {
    if (!scannedEvent) return
    if (registeredIds.has(scannedEvent.id)) {
      setModalOpen(false)
      return
    }

    setBusy(true)
    setRegistrationError(null)
    try {
      await registerForEvent(scannedEvent.id, sessionIds)
      setModalOpen(false)
      setNotice('Registration confirmed. This event is now in your registered events.')
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return <div className="empty-state"><ScanLine size={30} /><h3>Matching event QR…</h3><p>Please wait while the event list loads.</p></div>
  }

  if (!scannedCode || !scannedEvent) {
    return (
      <div>
        <PageHeader eyebrow="QR RESULT" title="Event Not Found" description="The scanned code does not match an available QMO event." />
        <section className="scan-result-state scan-result-state--error">
          <span><AlertCircle size={28} /></span>
          <div><h2>We couldn’t verify this event QR</h2><p>Use the official QR shown on a QMO event page, or scan the code again in better lighting.</p></div>
          <Link className="button button--primary" to="/events/scan"><ScanLine size={17} /> Scan another code</Link>
        </section>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="QR RESULT"
        title={notice ? 'Registration Confirmed' : alreadyRegistered ? 'Registration Found' : 'Register for Event'}
        description={notice ? 'Your event registration has been saved.' : alreadyRegistered ? 'This event is already connected to your account.' : 'Review the matched event before confirming your seat.'}
        action={<Link className="button button--outline" to="/events/scan"><ScanLine size={17} /> Scan another</Link>}
      />

      {notice ? (
        <section className="scan-result-state scan-result-state--success" role="status">
          <span><ShieldCheck size={28} /></span>
          <div><small>REGISTRATION CONFIRMED</small><h2>Your seat is reserved</h2><p>{notice}</p></div>
          <Link className="button button--primary" to={`/events/registered/${scannedEvent.id}`}>View registration details</Link>
        </section>
      ) : alreadyRegistered ? (
        <section className="scan-result-state scan-result-state--success" role="status">
          <span><CheckCircle2 size={28} /></span>
          <div><small>ALREADY REGISTERED</small><h2>No duplicate registration was created</h2><p>You already have a confirmed registration for <strong>{scannedEvent.title}</strong>.</p></div>
          <Link className="button button--primary" to={`/events/registered/${scannedEvent.id}`}>View registration details</Link>
        </section>
      ) : null}

      <div className="scan-result-event">
        <EventCard
          event={scannedEvent}
          registered={alreadyRegistered || Boolean(notice)}
          layout="horizontal"
          onRegister={() => {
            setRegistrationError(null)
            setModalOpen(true)
          }}
        />
      </div>

      <RegistrationConfirmModal
        event={modalOpen ? scannedEvent : null}
        sessions={eventSessions}
        registeredSessionIds={registeredSessionIds}
        busy={busy}
        error={registrationError}
        onClose={() => {
          if (busy) return
          setModalOpen(false)
          setRegistrationError(null)
        }}
        onConfirm={(sessionIds) => void confirmRegistration(sessionIds)}
      />
    </div>
  )
}
