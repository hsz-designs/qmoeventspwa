import { CalendarCheck2, ExternalLink, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatEventDates } from '../components/EventCard'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'

export function RegisteredEventsPage() {
  const { events, registeredIds } = useEventData()
  const registered = events.filter((event) => registeredIds.has(event.id))

  return (
    <div>
      <PageHeader
        eyebrow="MY EVENTS"
        title="My Registered Events"
        description="Manage your reservations and see everything you signed up for."
        action={<Link className="button button--primary" to="/events/new">Browse more events</Link>}
      />
      {registered.length ? (
        <div className="registration-table">
          <div className="registration-table__head"><span>Event</span><span>Schedule</span><span>Venue</span><span>Status</span><span /></div>
          {registered.map((event) => (
            <div className="registration-row" key={event.id}>
              <div className="registration-row__event"><span className={`dot tone-${event.imageTone}`} /><div><strong>{event.title}</strong><small>{event.category}</small></div></div>
              <div><strong>{formatEventDates(event.sessionDates?.length ? event.sessionDates : [event.date], true)}</strong><small>{event.time}</small></div>
              <div><span className="inline-detail"><MapPin size={14} />{event.venue}</span></div>
              <div><span className="status status--registered">Confirmed</span></div>
              <Link className="icon-button" to={`/events/registered/${event.id}`} aria-label={`View ${event.title} registration details`}><ExternalLink size={17} /></Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><CalendarCheck2 size={30} /><h3>No registrations yet</h3><p>Explore new events and reserve your first seat.</p></div>
      )}
    </div>
  )
}
