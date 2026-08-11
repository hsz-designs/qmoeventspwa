import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'
import type { QmoEventSession } from '../types'

function toLocalDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date)
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', weekday: 'short' }).format(toLocalDate(date))
}

function formatFullDay(date: string) {
  return new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric', weekday: 'long' }).format(toLocalDate(date))
}

function sameMonth(left: Date, right: Date) {
  return left.getMonth() === right.getMonth() && left.getFullYear() === right.getFullYear()
}

function getMonthDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const cells: Date[] = []

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), i - firstDay.getDay() + 1))
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day))
  }

  while (cells.length % 7 !== 0) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, cells.length - firstDay.getDay() - lastDay.getDate() + 1))
  }

  return cells
}

function keyForDate(date: Date | string) {
  const value = typeof date === 'string' ? toLocalDate(date) : date
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-')
}

export function CalendarPage() {
  const { sessions, isLoading } = useEventData()
  const today = keyForDate(new Date())
  const initialEventDate = sessions.find((session) => session.date >= today)?.date ?? sessions[0]?.date
  const initialSelectedDate = initialEventDate ?? today
  const [month, setMonth] = useState(() => toLocalDate(initialSelectedDate))
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)
  const [hasSyncedMonth, setHasSyncedMonth] = useState(Boolean(initialEventDate))

  useEffect(() => {
    if (hasSyncedMonth || !sessions.length) return
    const nextDate = sessions.find((session) => session.date >= today)?.date ?? sessions[0].date
    setMonth(toLocalDate(nextDate))
    setSelectedDate(nextDate)
    setHasSyncedMonth(true)
  }, [hasSyncedMonth, sessions, today])

  const sessionsByDay = useMemo(() => {
    return sessions.reduce<Record<string, QmoEventSession[]>>((groups, session) => {
      const key = session.date
      groups[key] = [...(groups[key] ?? []), session]
      return groups
    }, {})
  }, [sessions])

  const monthDays = useMemo(() => getMonthDays(month), [month])
  const selectedSessions = [...(sessionsByDay[selectedDate] ?? [])]
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1)
    const firstSession = sessions
      .filter((session) => sameMonth(toLocalDate(session.date), nextMonth))
      .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))[0]
    setMonth(nextMonth)
    setSelectedDate(firstSession?.date ?? keyForDate(nextMonth))
  }

  const selectDay = (day: Date) => {
    setSelectedDate(keyForDate(day))
    if (!sameMonth(day, month)) {
      setMonth(new Date(day.getFullYear(), day.getMonth(), 1))
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="SCHEDULE"
        title="Event Calendar"
        description="Browse every scheduled QMO session by month, with event details and venues in one view."
      />

      <section className="calendar-shell">
        <div className="calendar-toolbar">
          <button className="icon-button" type="button" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={19} /></button>
          <div><CalendarDays size={18} /><strong>{formatMonth(month)}</strong></div>
          <button className="icon-button" type="button" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={19} /></button>
        </div>

        <div className="calendar-grid" aria-label={`${formatMonth(month)} event session calendar`}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span className="calendar-grid__weekday" key={day}>{day}</span>)}
          {monthDays.map((day) => {
            const key = keyForDate(day)
            const daySessions = sessionsByDay[key] ?? []
            return (
              <button
                className={`calendar-day ${sameMonth(day, month) ? '' : 'is-muted'} ${selectedDate === key ? 'is-selected' : ''}`}
                key={key}
                type="button"
                onClick={() => selectDay(day)}
                aria-label={`${formatFullDay(key)}; ${daySessions.length} scheduled session${daySessions.length === 1 ? '' : 's'}`}
                aria-pressed={selectedDate === key}
              >
                <strong>{day.getDate()}</strong>
                <div>
                  {daySessions.slice(0, 3).map((session) => (
                    <span className={`calendar-chip tone-${session.imageTone}`} key={session.id}>{session.title}</span>
                  ))}
                  {daySessions.length > 3 && <small>+{daySessions.length - 3} more</small>}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="calendar-agenda">
        <div className="section-heading"><div><h2>{formatFullDay(selectedDate)}</h2><p>{selectedSessions.length} scheduled session{selectedSessions.length === 1 ? '' : 's'} on this date.</p></div></div>
        {isLoading ? (
          <div className="empty-state">Loading event sessions...</div>
        ) : selectedSessions.length ? (
          <div className="agenda-list">
            {selectedSessions.map((session) => (
              <article className="agenda-row" key={session.id}>
                <div className={`agenda-row__date tone-${session.imageTone}`}><strong>{toLocalDate(session.date).getDate()}</strong><span>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(toLocalDate(session.date))}</span></div>
                <div className="agenda-row__main">
                  <span>{formatDay(session.date)} · {session.category}</span>
                  <h3>{session.title}</h3>
                  <p>{session.eventTitle}</p>
                </div>
                <div className="agenda-row__meta">
                  <span><Clock3 size={14} />{session.time}</span>
                  <span><MapPin size={14} />{session.venue}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><CalendarDays size={30} /><h3>No sessions on this date</h3><p>Select another date to view its event details.</p></div>
        )}
      </section>
    </div>
  )
}
