import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { certificates as demoCertificates, events as demoEvents, pastEvents as demoPastEvents } from '../data/mockData'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Certificate, EventCategory, QmoEvent, QmoEventSession } from '../types'
import { useAuth } from './AuthContext'

interface EventDataContextValue {
  events: QmoEvent[]
  sessions: QmoEventSession[]
  history: QmoEvent[]
  certificates: Certificate[]
  registeredIds: Set<string>
  registeredSessionIds: Set<string>
  isLoading: boolean
  registerForEvent: (eventId: string, sessionIds?: string[]) => Promise<void>
}

interface EventRow {
  id: number
  event_name: string
  event_description: string | null
  start_datetime: string
  end_datetime: string | null
  place_id: number | null
  status: string | null
  qrcode_value: string | null
}

interface EventSessionRow {
  id: number
  session_event_id: number
  session_building_id: number | null
  session_floor_id: number | null
  session_room_id: number | null
  session_topic: string | null
  session_date: string
  session_start_time: string | null
  session_end_time: string | null
  session_max_capacity: number | null
  status: string | number | null
}

interface EventAttendeeRow {
  id: number
  event_id: number
  user_id: string | null
  date_time_first_in?: string | null
  date_time_last_out?: string | null
  status: string | number | null
  session_id: number | null
  certificate_url?: string | null
}

interface EventRegistrationInsert {
  created_at: string
  user_id: string
  event_id: number
  date_time_first_in: null
  date_time_last_out: null
  date_index: number
  status: string
  session_id: number | null
  certificate_url: null
}

interface PlaceRow {
  id: number
  place_name: string | null
  room_id: number | null
}

interface RoomRow {
  id: number
  room_no: string | null
  room_max_capacity: number | null
  building_id: number | null
}

interface BuildingRow {
  id: number
  building_name: string | null
}

const EventDataContext = createContext<EventDataContextValue | undefined>(undefined)

function getEventCategory(row: EventRow): EventCategory {
  const text = `${row.event_name} ${row.event_description ?? ''}`.toLowerCase()
  if (text.includes('workshop')) return 'Workshop'
  if (text.includes('orientation')) return 'Orientation'
  if (text.includes('challenge')) return 'Community'
  if (text.includes('review') || text.includes('planning')) return 'Seminar'
  return 'Training'
}

function getTone(index: number): QmoEvent['imageTone'] {
  return (['blue', 'gold', 'teal', 'violet', 'coral'] as const)[index % 5]
}

function formatTimeRange(startsAt: Date, endsAt: Date | null) {
  const startTime = startsAt.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  const endTime = endsAt?.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  return endTime ? `${startTime} – ${endTime}` : startTime
}

function formatSessionTime(startTime: string | null, endTime: string | null) {
  if (!startTime) return 'Time to be announced'
  const startDate = new Date(`2026-01-01T${startTime}`)
  const endDate = endTime ? new Date(`2026-01-01T${endTime}`) : null
  return formatTimeRange(startDate, endDate && endDate > startDate ? endDate : null)
}

function getSessionDateTime(session: EventSessionRow) {
  return new Date(`${session.session_date}T${session.session_start_time ?? '00:00:00'}`)
}

function mapNuEvent(
  row: EventRow,
  sessions: EventSessionRow[],
  registeredCount = 0,
  capacity = 100,
  venue = 'NU Manila',
  index = 0,
): QmoEvent {
  const sortedSessions = [...sessions].sort((left, right) => getSessionDateTime(left).getTime() - getSessionDateTime(right).getTime())
  const startsAt = sortedSessions[0] ? getSessionDateTime(sortedSessions[0]) : new Date(row.start_datetime)
  const endsAt = row.end_datetime ? new Date(row.end_datetime) : null
  const date = sortedSessions[0]?.session_date ?? row.start_datetime.slice(0, 10)
  const sessionDates = [...new Set(sortedSessions.map((session) => session.session_date))]
  return {
    id: String(row.id),
    title: row.event_name,
    description: row.event_description ?? '',
    category: getEventCategory(row),
    date,
    sessionDates: sessionDates.length ? sessionDates : [date],
    time: sortedSessions.length > 1 ? `${sortedSessions.length} sessions` : formatSessionTime(sortedSessions[0]?.session_start_time ?? null, sortedSessions[0]?.session_end_time ?? null) || formatTimeRange(startsAt, endsAt),
    venue,
    capacity,
    registered: registeredCount,
    imageTone: getTone(index),
    featured: row.status === 'published' || sortedSessions.some((session) => String(session.status) === '1'),
    sessionCount: sortedSessions.length,
    qrCodeValue: row.qrcode_value?.trim() || undefined,
  }
}

function getVenue(event: EventRow, places: PlaceRow[], rooms: RoomRow[], buildings: BuildingRow[]) {
  const place = places.find((item) => item.id === event.place_id)
  const room = rooms.find((item) => item.id === place?.room_id)
  const building = buildings.find((item) => item.id === room?.building_id)
  return [place?.place_name, room?.room_no ? `Room ${room.room_no}` : null, building?.building_name].filter(Boolean).join(', ') || 'NU Manila'
}

function getSessionVenue(session: EventSessionRow, rooms: RoomRow[], buildings: BuildingRow[], fallback: string) {
  const room = rooms.find((item) => item.id === session.session_room_id)
  const building = buildings.find((item) => item.id === (session.session_building_id ?? room?.building_id))
  return [room?.room_no ? `Room ${room.room_no}` : null, building?.building_name].filter(Boolean).join(', ') || fallback
}

function makeDemoSessions(events: QmoEvent[]): QmoEventSession[] {
  return events.map((event) => ({
    id: `${event.id}-session`,
    eventId: event.id,
    title: event.title,
    eventTitle: event.title,
    description: event.description,
    category: event.category,
    date: event.date,
    time: event.time,
    venue: event.venue,
    capacity: event.capacity,
    status: event.status,
    imageTone: event.imageTone,
  }))
}

export function EventProvider({ children }: { children: ReactNode }) {
  const { user, isDemoMode } = useAuth()
  const shouldUseDemoData = !isSupabaseConfigured
  const [eventList, setEventList] = useState<QmoEvent[]>(shouldUseDemoData ? demoEvents : [])
  const [sessionList, setSessionList] = useState<QmoEventSession[]>(shouldUseDemoData ? makeDemoSessions([...demoEvents, ...demoPastEvents]) : [])
  const [history, setHistory] = useState<QmoEvent[]>(shouldUseDemoData ? demoPastEvents : [])
  const [certificates, setCertificates] = useState<Certificate[]>(shouldUseDemoData ? demoCertificates : [])
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(shouldUseDemoData ? new Set(['qmo-001']) : new Set())
  const [registeredSessionIds, setRegisteredSessionIds] = useState<Set<string>>(shouldUseDemoData ? new Set(['qmo-001-session']) : new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!supabase || isDemoMode) return
    const client = supabase

    let isMounted = true
    const loadData = async () => {
      setIsLoading(true)
      const [eventsResult, registrationsResult, certificateResult] = await Promise.all([
        client.from('nu_events').select('*').order('start_datetime'),
        user ? client.from('nu_event_attendees').select('*').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
        user ? client.from('nu_event_attendees').select('id,event_id,certificate_url').eq('user_id', user.id).not('certificate_url', 'is', null) : Promise.resolve({ data: [], error: null }),
      ])

      const [sessionsResult, attendeeCountsResult, placesResult, roomsResult, buildingsResult] = await Promise.all([
        client.from('nu_event_sessions').select('*'),
        client.from('nu_event_attendees').select('event_id,status'),
        client.from('nu_places').select('*'),
        client.from('nu_rooms').select('*'),
        client.from('nu_buildings').select('*'),
      ])

      if (!isMounted) return

      if (!eventsResult.error && !sessionsResult.error && eventsResult.data) {
        const rows = eventsResult.data as EventRow[]
        const now = new Date()
        const sessions = (sessionsResult.data ?? []) as EventSessionRow[]
        const attendees = (attendeeCountsResult.data ?? []) as EventAttendeeRow[]
        const places = (placesResult.data ?? []) as PlaceRow[]
        const rooms = (roomsResult.data ?? []) as RoomRow[]
        const buildings = (buildingsResult.data ?? []) as BuildingRow[]

        const mappedEvents = rows.map((row, index) => {
          const eventSessions = sessions.filter((session) => session.session_event_id === row.id)
          const sessionCapacity = eventSessions.reduce((total, session) => total + (session.session_max_capacity ?? 0), 0)
          const roomCapacity = eventSessions.reduce((total, session) => {
            const room = rooms.find((item) => item.id === session.session_room_id)
            return total + (room?.room_max_capacity ?? 0)
          }, 0)
          const registeredCount = attendees.filter((attendee) => attendee.event_id === row.id).length
          const eventVenue = eventSessions[0] ? getSessionVenue(eventSessions[0], rooms, buildings, getVenue(row, places, rooms, buildings)) : getVenue(row, places, rooms, buildings)
          return mapNuEvent(row, eventSessions, registeredCount, sessionCapacity || roomCapacity || 100, eventVenue, index)
        })

        const mappedSessions = sessions
          .reduce<QmoEventSession[]>((items, session, index) => {
            const event = rows.find((row) => row.id === session.session_event_id)
            if (!event) return items
            const fallbackVenue = getVenue(event, places, rooms, buildings)
            const room = rooms.find((item) => item.id === session.session_room_id)
            items.push({
              id: String(session.id),
              eventId: String(event.id),
              title: session.session_topic || event.event_name,
              eventTitle: event.event_name,
              description: event.event_description ?? '',
              category: getEventCategory(event),
              date: session.session_date,
              time: formatSessionTime(session.session_start_time, session.session_end_time),
              venue: getSessionVenue(session, rooms, buildings, fallbackVenue),
              capacity: session.session_max_capacity ?? room?.room_max_capacity ?? 100,
              status: session.status === null ? event.status ?? undefined : String(session.status),
              imageTone: getTone(index),
            })
            return items
          }, [])
          .sort((left, right) => new Date(`${left.date}T00:00:00`).getTime() - new Date(`${right.date}T00:00:00`).getTime())

        const getLastEventDate = (event: QmoEvent) => event.sessionDates?.at(-1) ?? event.date
        const userRegistrations = !registrationsResult.error && registrationsResult.data
          ? registrationsResult.data as EventAttendeeRow[]
          : []
        setEventList(mappedEvents.filter((event) => new Date(`${getLastEventDate(event)}T23:59:59`) >= now))
        setHistory(
          mappedEvents
            .filter((event) => new Date(`${getLastEventDate(event)}T23:59:59`) < now)
            .filter((event) => userRegistrations.some((registration) => String(registration.event_id) === event.id))
            .map((event) => {
              const eventRegistrations = userRegistrations.filter((registration) => String(registration.event_id) === event.id)
              const attended = eventRegistrations.some((registration) =>
                String(registration.status) === '1' || Boolean(registration.date_time_first_in),
              )
              return { ...event, status: attended ? 'attended' as const : 'missed' as const }
            }),
        )
        setSessionList(mappedSessions)
      } else {
        setEventList([])
        setHistory([])
        setSessionList([])
      }

      if (!registrationsResult.error && registrationsResult.data) {
        const registrations = registrationsResult.data as EventAttendeeRow[]
        const ids = new Set(registrations.map((item) => String(item.event_id)))
        setRegisteredIds(ids)
        setRegisteredSessionIds(new Set(registrations.flatMap((item) => item.session_id === null ? [] : [String(item.session_id)])))
      }

      if (!certificateResult.error && certificateResult.data) {
        setCertificates(
          certificateResult.data.map((item) => {
            const event = (eventsResult.data as EventRow[] | null)?.find((row) => row.id === item.event_id)
            return {
              id: String(item.id),
              title: event?.event_name ?? 'QMO Event',
              eventDate: event?.start_datetime.slice(0, 10) ?? '',
              issuedDate: new Date().toISOString().slice(0, 10),
              certificateNumber: `NU-QMO-${item.event_id}-${item.id}`,
              downloadUrl: item.certificate_url as string | undefined,
            }
          }),
        )
      }
      setIsLoading(false)
    }

    void loadData()
    return () => {
      isMounted = false
    }
  }, [user, isDemoMode])

  const value = useMemo<EventDataContextValue>(
    () => ({
      events: eventList,
      sessions: sessionList,
      history,
      certificates,
      registeredIds,
      registeredSessionIds,
      isLoading,
      registerForEvent: async (eventId, sessionIds) => {
        if (!user) throw new Error('Please sign in to register.')
        const eventSessions = sessionList
          .filter((session) => session.eventId === eventId)
          .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
        const requestedIds = new Set(sessionIds ?? eventSessions.map((session) => session.id))
        const selectedSessions = eventSessions.filter((session) => requestedIds.has(session.id))
        if (eventSessions.length && !selectedSessions.length) throw new Error('Select at least one session to register.')
        if (!eventSessions.length && registeredIds.has(eventId)) throw new Error('You are already registered for this event.')
        if (eventSessions.length && selectedSessions.every((session) => registeredSessionIds.has(session.id))) {
          throw new Error('You are already registered for the selected event sessions.')
        }

        let addedRegistrationCount = 0
        let registeredIdsForSessions = selectedSessions.map((session) => session.id)

        if (supabase && !isDemoMode) {
          const numericEventId = Number(eventId)
          if (!Number.isSafeInteger(numericEventId)) throw new Error('This event has an invalid database ID.')

          const { data: existingRegistrations, error: lookupError } = await supabase
            .from('nu_event_attendees')
            .select('id,session_id')
            .eq('user_id', user.id)
            .eq('event_id', numericEventId)

          if (lookupError) throw lookupError
          const existingRows = (existingRegistrations ?? []) as Pick<EventAttendeeRow, 'id' | 'session_id'>[]
          const existingSessionIds = new Set(existingRows.flatMap((item) => item.session_id === null ? [] : [String(item.session_id)]))
          const missingSessions = selectedSessions.filter((session) => !existingSessionIds.has(session.id))

          if ((!eventSessions.length && existingRows.length) || (eventSessions.length && !missingSessions.length)) {
            throw new Error('You are already registered for this event.')
          }

          const registrationsToInsert: EventRegistrationInsert[] = eventSessions.length
            ? missingSessions.map((session) => {
              const sessionId = Number(session.id)
              if (!Number.isSafeInteger(sessionId)) throw new Error('A selected session has an invalid database ID.')
              return {
                created_at: new Date().toISOString(),
                user_id: user.id,
                event_id: numericEventId,
                date_time_first_in: null,
                date_time_last_out: null,
                date_index: eventSessions.findIndex((item) => item.id === session.id),
                status: '0',
                session_id: sessionId,
                certificate_url: null,
              }
            })
            : existingRows.length ? [] : [{
              created_at: new Date().toISOString(),
              user_id: user.id,
              event_id: numericEventId,
              date_time_first_in: null,
              date_time_last_out: null,
              date_index: 0,
              status: '0',
              session_id: null,
              certificate_url: null,
            }]

          if (registrationsToInsert.length) {
            const { error } = await supabase.from('nu_event_attendees').insert(registrationsToInsert).select('id')
            if (error) throw error
          }
          addedRegistrationCount = registrationsToInsert.length
          registeredIdsForSessions = [...new Set([...existingSessionIds, ...selectedSessions.map((session) => session.id)])]
        } else {
          addedRegistrationCount = selectedSessions.filter((session) => !registeredSessionIds.has(session.id)).length
        }

        setRegisteredIds((current) => new Set([...current, eventId]))
        setRegisteredSessionIds((current) => new Set([...current, ...registeredIdsForSessions]))
        setEventList((current) => current.map((event) => event.id === eventId
          ? { ...event, registered: Math.min(event.registered + addedRegistrationCount, event.capacity) }
          : event))
      },
    }),
    [eventList, sessionList, history, certificates, registeredIds, registeredSessionIds, isLoading, user, isDemoMode],
  )

  return <EventDataContext.Provider value={value}>{children}</EventDataContext.Provider>
}

export function useEventData() {
  const context = useContext(EventDataContext)
  if (!context) throw new Error('useEventData must be used within EventProvider')
  return context
}
