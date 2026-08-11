import { CheckCircle2, Clock3, History, LogIn, MapPin, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatEventDates } from '../components/EventCard'
import { PageHeader } from '../components/PageHeader'
import { useEventData } from '../context/EventContext'

export function HistoryPage() {
  const { history } = useEventData()
  const attendedCount = history.filter((event) => event.status === 'attended' || event.status === 'completed').length

  return (
    <div>
      <PageHeader
        eyebrow="ACTIVITY"
        title="My Attended Events"
        description="A complete record of your past QMO registrations and attendance."
        action={<Link className="button button--outline" to="/history/login-logout"><LogIn size={17} /> Login &amp; logout history</Link>}
      />
      <div className="history-stats">
        <div><span><History size={20} /></span><strong>{history.length}</strong><small>Total registrations</small></div>
        <div><span><CheckCircle2 size={20} /></span><strong>{attendedCount}</strong><small>Events attended</small></div>
        <div><span><XCircle size={20} /></span><strong>{history.length - attendedCount}</strong><small>Not attended</small></div>
      </div>
      <section className="history-panel">
        <div className="section-heading"><div><h2>Previous events</h2><p>Latest activity appears first.</p></div></div>
        {history.length ? <div className="history-list">
          {history.map((event) => {
            const attended = event.status === 'attended' || event.status === 'completed'
            return (
              <article className="history-row" key={event.id}>
                <span className={`history-row__marker ${attended ? 'attended' : 'missed'}`}>{attended ? <CheckCircle2 size={19} /> : <XCircle size={19} />}</span>
                <div className="history-row__main"><span>{event.category}</span><strong>{event.title}</strong><small><Clock3 size={13} /> {formatEventDates(event.sessionDates?.length ? event.sessionDates : [event.date])} · {event.time}</small></div>
                <div className="history-row__venue"><MapPin size={15} />{event.venue}</div>
                <span className={`status ${attended ? 'status--attended' : 'status--missed'}`}>{attended ? 'Attended' : 'Not attended'}</span>
              </article>
            )
          })}
        </div> : (
          <div className="empty-state history-empty-state">
            <History size={38} />
            <h3>No previous events yet</h3>
            <p>Your attended and missed events will appear here.</p>
          </div>
        )}
      </section>
    </div>
  )
}
