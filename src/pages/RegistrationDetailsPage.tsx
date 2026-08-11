import { CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EventCard, formatEventDate } from '../components/EventCard'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'

export function RegistrationDetailsPage() {
  const { eventId = '' } = useParams()
  const { events, sessions, registeredIds, registeredSessionIds, isLoading } = useEventData()
  const event = events.find((item) => item.id === eventId)
  const registeredSessions = sessions.filter((session) => session.eventId === eventId && registeredSessionIds.has(session.id))

  if (isLoading) return <div className="empty-state">Loading registration details…</div>

  if (!event || !registeredIds.has(eventId)) {
    return (
      <div>
        <PageHeader eyebrow="REGISTRATION" title="Registration Not Found" description="There is no confirmed registration for this event on your account." />
        <div className="empty-state"><ShieldCheck size={30} /><h3>No registration to display</h3><p>Browse available events or return to your registered events.</p><div className="empty-state__actions"><Link className="button button--primary" to="/events/new">Browse events</Link><Link className="button button--outline" to="/events/registered">My registrations</Link></div></div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="REGISTRATION"
        title="Registration Details"
        description="Your confirmed reservation, event access QR, and selected sessions."
        action={<Link className="button button--outline" to="/events/registered">All registrations</Link>}
      />

      <section className="registration-confirmation">
        <span className="registration-confirmation__icon"><CheckCircle2 size={29} /></span>
        <div><small>CONFIRMED REGISTRATION</small><h2>{event.title}</h2><p>Present your personal QR or the event QR at the check-in desk when requested.</p></div>
        <span className="status status--registered">Confirmed</span>
      </section>

      <div className="registration-detail-grid">
        <EventCard event={event} registered layout="horizontal" />
        <section className="registration-detail-panel">
          <div className="section-heading"><div><h2>Registered sessions</h2><p>{registeredSessions.length ? `${registeredSessions.length} selected session${registeredSessions.length === 1 ? '' : 's'}.` : 'This registration covers the main event.'}</p></div></div>
          {registeredSessions.length ? (
            <div className="registered-session-list">
              {registeredSessions.map((session) => (
                <article key={session.id}>
                  <span className={`registered-session-list__date tone-${session.imageTone}`}><strong>{new Date(`${session.date}T00:00:00`).getDate()}</strong><small>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(new Date(`${session.date}T00:00:00`))}</small></span>
                  <div><h3>{session.title}</h3><span><CalendarDays size={14} /> {formatEventDate(session.date)}</span><span><Clock3 size={14} /> {session.time}</span><span><MapPin size={14} /> {session.venue}</span></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="registration-main-event"><CalendarDays size={21} /><div><strong>Main event registration</strong><span>Your registration applies to the full event schedule.</span></div></div>
          )}
        </section>
      </div>
    </div>
  )
}
