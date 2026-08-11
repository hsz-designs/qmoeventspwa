import {
  ArrowRight,
  Award,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  Clock3,
  History,
  MapPin,
  QrCode,
  ScanLine,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatEventDates } from '../components/EventCard'
import { QrCodeImage } from '../components/QrCodeImage'
import { useAuth } from '../context/AuthContext'
import { useEventData } from '../context/EventContext'
import { getEventQrValue } from '../lib/eventQr'

const quickActions = [
  { title: 'My Certificates', subtitle: 'View & download', icon: Award, to: '/certificates', color: 'blue' },
  { title: 'Registered Events', subtitle: 'Your reservations', icon: CalendarCheck2, to: '/events/registered', color: 'gold' },
  { title: 'Upcoming Events', subtitle: 'View your schedule', icon: CalendarClock, to: '/events/upcoming', color: 'teal' },
  { title: 'New Events', subtitle: 'Explore & register', icon: Sparkles, to: '/events/new', color: 'violet' },
  { title: 'Attended Events', subtitle: 'Past attendance', icon: History, to: '/history', color: 'coral' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardPage() {
  const { user, isDemoMode } = useAuth()
  const { events, history, registeredIds, certificates } = useEventData()
  const featuredEvent = events.find((event) => event.featured) ?? events[0]
  const firstName = user?.fullName.split(' ')[0] ?? 'Nationalian'
  const userQrCode = user?.userQrCode ?? (isDemoMode ? user?.studentNumber : undefined)
  const attendedCount = history.filter((event) => event.status === 'attended' || event.status === 'completed').length

  return (
    <div className="dashboard">
      <header className="dashboard__heading">
        <div>
          <span>{getGreeting()},</span>
          <h1>{firstName} <span aria-hidden="true">👋</span></h1>
          <p>Here’s what’s happening at QMO NU Manila.</p>
        </div>
        <div className="dashboard__heading-actions">
          <Link className="button button--primary" to="/events/scan"><ScanLine size={17} /> Scan event QR</Link>
          <Link className="button button--outline" to="/events/new"><Sparkles size={17} /> Discover events</Link>
        </div>
      </header>

      <section className="dashboard-identity">
        <div className="dashboard-identity__copy">
          <span className="dashboard-identity__icon"><QrCode size={25} /></span>
          <div><small>MY DIGITAL PASS</small><h2>Your personal attendance QR</h2><p>Keep this ready for fast and secure event check-in.</p></div>
        </div>
        {userQrCode ? (
          <QrCodeImage
            className="dashboard-identity__qr"
            value={userQrCode}
            label={`${user?.fullName ?? 'NU User'} user QR code`}
            title={user?.fullName?.trim() || 'NU User'}
            subtitle={user?.email ?? 'NU event participant'}
            badge="Personal attendance QR"
            filename={`QMO-${user?.fullName?.trim() || 'NU-User'}-profile-QR-card`}
            variant="profile"
          />
        ) : (
          <div className="dashboard-identity__empty"><QrCode size={27} /><span>Personal QR unavailable</span><Link to="/profile">View profile</Link></div>
        )}
      </section>

      {featuredEvent && (
        <section className="hero-event">
          <div className="hero-event__pattern" aria-hidden="true" />
          <div className="hero-event__content">
            <span className="hero-event__badge"><CalendarDays size={15} /> Next on your calendar</span>
            <h2>{featuredEvent.title}</h2>
            <div className="hero-event__meta">
              <span><CalendarDays size={17} /> {formatEventDates(featuredEvent.sessionDates?.length ? featuredEvent.sessionDates : [featuredEvent.date])}</span>
              <span><Clock3 size={17} /> {featuredEvent.time}</span>
              <span><MapPin size={17} /> {featuredEvent.venue}</span>
            </div>
            <Link className="button button--gold" to="/events/upcoming">View event details <ArrowRight size={17} /></Link>
          </div>
          <div className="hero-event__date">
            <span>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(new Date(`${featuredEvent.date}T00:00:00`))}</span>
            <strong>{new Date(`${featuredEvent.date}T00:00:00`).getDate()}</strong>
            <small>{new Date(`${featuredEvent.date}T00:00:00`).getFullYear()}</small>
          </div>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div><h2>Quick access</h2><p>Everything you need, one tap away.</p></div>
        </div>
        <div className="quick-grid">
          {quickActions.map((action) => (
            <Link to={action.to} key={action.title} className="quick-card">
              <span className={`quick-card__icon quick-card__icon--${action.color}`}><action.icon size={23} /></span>
              <div><strong>{action.title}</strong><span>{action.subtitle}</span></div>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-section dashboard-section--panel">
          <div className="section-heading">
            <div><h2>Coming up</h2><p>Upcoming QMO events and access QR codes.</p></div>
            <Link to="/events/upcoming">View all <ArrowRight size={15} /></Link>
          </div>
          <div className="upcoming-list">
            {events.slice(0, 3).map((event) => {
              const eventDates = formatEventDates(event.sessionDates?.length ? event.sessionDates : [event.date])
              const isRegistered = registeredIds.has(event.id)
              return (
                <article className="upcoming-row" key={event.id}>
                  <div className={`upcoming-row__date tone-${event.imageTone}`}>
                    <strong>{new Date(`${event.date}T00:00:00`).getDate()}</strong>
                    <span>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(new Date(`${event.date}T00:00:00`))}</span>
                  </div>
                  <div className="upcoming-row__copy">
                    <span>{event.category}</span>
                    <strong>{event.title}</strong>
                    <small><Clock3 size={13} /> {event.time} · {event.venue}</small>
                  </div>
                  <div className="upcoming-row__actions">
                    <span className={isRegistered ? 'status status--registered' : 'status status--open'}>{isRegistered ? 'Registered' : 'Open'}</span>
                    {isRegistered ? <Link className="button button--outline button--small" to={`/events/registered/${event.id}`}>View registration details</Link> : null}
                  </div>
                  <QrCodeImage
                    className="dashboard-event-qr"
                    value={getEventQrValue(event)}
                    label={`${event.title} event QR code`}
                    title={event.title}
                    subtitle={`${eventDates} · ${event.venue}`}
                    badge="Event access QR"
                    filename={`QMO-${event.title}-QR-card`}
                    variant="event"
                  />
                </article>
              )
            })}
          </div>
        </section>

        <aside className="dashboard-side">
          <section className="mini-stats">
            <div><span className="mini-stats__icon"><CalendarCheck2 size={19} /></span><strong>{registeredIds.size}</strong><small>Registered</small></div>
            <div><span className="mini-stats__icon"><Users size={19} /></span><strong>{attendedCount}</strong><small>Attended</small></div>
            <div><span className="mini-stats__icon"><Award size={19} /></span><strong>{certificates.length}</strong><small>Certificates</small></div>
          </section>
          <section className="quality-note">
            <span className="quality-note__icon"><Sparkles size={20} /></span>
            <div><span>QMO NOTE</span><h3>Your voice shapes quality.</h3><p>Complete the post-event survey after attending to help us improve future programs.</p></div>
          </section>
        </aside>
      </div>
    </div>
  )
}
