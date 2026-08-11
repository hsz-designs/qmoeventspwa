import { CalendarClock } from 'lucide-react'
import { EventCard } from '../components/EventCard'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'

export function UpcomingEventsPage() {
  const { events, registeredIds } = useEventData()
  const upcoming = events.filter((event) => registeredIds.has(event.id))

  return (
    <div>
      <PageHeader eyebrow="YOUR SCHEDULE" title="My Upcoming Events" description="Your confirmed events, organized and ready when you are." />
      <div className="summary-strip">
        <span className="summary-strip__icon"><CalendarClock size={22} /></span>
        <div><strong>{upcoming.length} upcoming {upcoming.length === 1 ? 'event' : 'events'}</strong><span>We’ll keep this list updated as you register.</span></div>
      </div>
      {upcoming.length ? (
        <div className="event-list">
          {upcoming.map((event) => <EventCard key={event.id} event={event} registered layout="horizontal" />)}
        </div>
      ) : (
        <div className="empty-state"><CalendarClock size={30} /><h3>Your calendar is open</h3><p>Register for a new event and it will appear here.</p></div>
      )}
    </div>
  )
}
