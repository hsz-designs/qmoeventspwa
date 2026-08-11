import { ArrowRight, CalendarDays, Check, Clock3, MapPin, Users } from 'lucide-react'
import { getEventQrValue } from '../lib/eventQr'
import type { QmoEvent } from '../types'
import { QrCodeImage } from './QrCodeImage'

export function formatEventDate(date: string, short = false) {
  return new Intl.DateTimeFormat('en-PH', {
    month: short ? 'short' : 'long',
    day: 'numeric',
    year: short ? undefined : 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function formatEventDates(dates: string[], short = false) {
  return [...new Set(dates)].sort().map((date) => formatEventDate(date, short)).join(', ')
}

interface EventCardProps {
  event: QmoEvent
  registered?: boolean
  partiallyRegistered?: boolean
  onRegister?: (eventId: string) => void
  registerBusy?: boolean
  layout?: 'vertical' | 'horizontal'
}

export function EventCard({ event, registered, partiallyRegistered, onRegister, registerBusy, layout = 'vertical' }: EventCardProps) {
  const seatsLeft = Math.max(event.capacity - event.registered, 0)
  const sessionDates = event.sessionDates?.length ? event.sessionDates : [event.date]
  const firstDate = new Date(`${sessionDates[0]}T00:00:00`)
  const formattedDates = formatEventDates(sessionDates)

  return (
    <article className={`event-card event-card--${layout}`}>
      <div className={`event-card__visual tone-${event.imageTone}`}>
        <div className="event-card__date">
          <strong>{firstDate.getDate()}</strong>
          <span>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(firstDate)}{sessionDates.length > 1 ? ` +${sessionDates.length - 1}` : ''}</span>
        </div>
        <div className="event-card__pattern" aria-hidden="true" />
        <span className="event-card__category">{event.category}</span>
      </div>
      <div className="event-card__body">
        <div>
          <span className="event-card__date-mobile">
            <CalendarDays size={14} /> {formattedDates}
          </span>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
        </div>
        <div className="event-card__details">
          <span className="event-card__session-dates"><CalendarDays size={15} /> {formattedDates}</span>
          <span><Clock3 size={15} /> {event.time}</span>
          <span><MapPin size={15} /> {event.venue}</span>
          {event.sessionCount ? <span><CalendarDays size={15} /> {event.sessionCount} session{event.sessionCount === 1 ? '' : 's'}</span> : null}
          <span><Users size={15} /> {seatsLeft} seats available</span>
        </div>
        <QrCodeImage
          className="event-card__qr"
          value={getEventQrValue(event)}
          label={`${event.title} event QR code`}
          title={event.title}
          subtitle={`${formattedDates} · ${event.venue}`}
          badge="Event access QR"
          filename={`QMO-${event.title}-QR-card`}
          variant="event"
        />
        <div className="event-card__footer">
          <div className="capacity" aria-label={`${event.registered} out of ${event.capacity} seats filled`}>
            <span><i style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }} /></span>
            <small>{event.registered}/{event.capacity}</small>
          </div>
          {registered ? (
            <button className="button button--registered" type="button" disabled>
              <Check size={17} /> Registered
            </button>
          ) : (
            <button
              className="button button--primary button--small"
              type="button"
              disabled={registerBusy || seatsLeft === 0}
              onClick={() => onRegister?.(event.id)}
            >
              {registerBusy ? 'Registering…' : seatsLeft === 0 ? 'Event full' : partiallyRegistered ? 'Manage sessions' : 'Register'} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
