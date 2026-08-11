import { Search, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EventCard } from '../components/EventCard'
import { PageHeader } from '../components/PageHeader'
import { RegistrationConfirmModal } from '../components/RegistrationConfirmModal'
import { useEventData } from '../context/EventContext'
import type { QmoEvent } from '../types'

const categories = ['All', 'Training', 'Seminar', 'Workshop', 'Orientation', 'Community']

export function NewEventsPage() {
  const { events, sessions, registeredIds, registeredSessionIds, registerForEvent, isLoading } = useEventData()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [eventToRegister, setEventToRegister] = useState<QmoEvent | null>(null)
  const [registrationError, setRegistrationError] = useState<string | null>(null)

  const filteredEvents = useMemo(
    () => events.filter((event) => {
      const matchesSearch = `${event.title} ${event.description} ${event.venue}`.toLowerCase().includes(search.toLowerCase())
      return matchesSearch && (category === 'All' || event.category === category)
    }),
    [events, search, category],
  )

  const sessionsByEvent = useMemo(() => sessions.reduce<Map<string, typeof sessions>>((groups, session) => {
    const eventSessions = groups.get(session.eventId) ?? []
    groups.set(session.eventId, [...eventSessions, session])
    return groups
  }, new Map()), [sessions])

  const eventToRegisterSessions = eventToRegister ? (sessionsByEvent.get(eventToRegister.id) ?? []) : []

  const requestRegistration = (eventId: string) => {
    const selectedEvent = events.find((event) => event.id === eventId)
    if (!selectedEvent) return
    setRegistrationError(null)
    setEventToRegister(selectedEvent)
  }

  const confirmRegistration = async (sessionIds: string[]) => {
    if (!eventToRegister) return
    setBusyId(eventToRegister.id)
    setNotice(null)
    setRegistrationError(null)
    try {
      await registerForEvent(eventToRegister.id, sessionIds)
      setNotice(sessionIds.length > 1
        ? `Your seats are reserved for ${sessionIds.length} sessions.`
        : 'Your seat is reserved. The event is now in My Registered Events.')
      setEventToRegister(null)
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="DISCOVER" title="New Events" description="Find your next opportunity to learn, connect, and contribute." />
      <div className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events, topics, or venues" aria-label="Search events" />
        </label>
        <button className="button button--outline filter-button" type="button"><SlidersHorizontal size={17} /> Filters</button>
      </div>
      <div className="category-tabs" role="tablist" aria-label="Event categories">
        {categories.map((item) => (
          <button key={item} type="button" className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      {notice && <div className="page-notice" role="status"><Sparkles size={17} /> {notice}</div>}
      {isLoading ? (
        <div className="empty-state">Loading QMO events…</div>
      ) : filteredEvents.length ? (
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registered={(sessionsByEvent.get(event.id)?.length ?? 0) > 0
                ? sessionsByEvent.get(event.id)?.every((session) => registeredSessionIds.has(session.id))
                : registeredIds.has(event.id)}
              partiallyRegistered={sessionsByEvent.get(event.id)?.some((session) => registeredSessionIds.has(session.id))}
              onRegister={requestRegistration}
              registerBusy={busyId === event.id}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state"><Search size={28} /><h3>No matching events</h3><p>Try another search or category.</p></div>
      )}
      <RegistrationConfirmModal
        event={eventToRegister}
        sessions={eventToRegisterSessions}
        registeredSessionIds={registeredSessionIds}
        busy={Boolean(busyId)}
        error={registrationError}
        onClose={() => {
          if (busyId) return
          setEventToRegister(null)
          setRegistrationError(null)
        }}
        onConfirm={(sessionIds) => void confirmRegistration(sessionIds)}
      />
    </div>
  )
}
