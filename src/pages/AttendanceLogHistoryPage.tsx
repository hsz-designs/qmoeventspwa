import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, History, LogIn, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useEventData } from '../context/EventContext'
import { supabase } from '../lib/supabase'
import type { AttendanceLog } from '../types'

interface AttendanceLogRow {
  id: number | string
  event_id: number | string
  session_id: number | string | null
  date_time: string | null
  created_at: string | null
  log_type: string | number | null
}

const demoAttendanceLogs: AttendanceLog[] = [
  { id: 'demo-log-1', eventId: 'past-001', sessionId: 'past-001-session', occurredAt: '2026-05-16T09:01:00+08:00', type: 'login' },
  { id: 'demo-log-2', eventId: 'past-001', sessionId: 'past-001-session', occurredAt: '2026-05-16T12:04:00+08:00', type: 'logout' },
  { id: 'demo-log-3', eventId: 'past-002', sessionId: 'past-002-session', occurredAt: '2026-03-22T12:57:00+08:00', type: 'login' },
  { id: 'demo-log-4', eventId: 'past-002', sessionId: 'past-002-session', occurredAt: '2026-03-22T17:06:00+08:00', type: 'logout' },
]

function getLogType(value: AttendanceLogRow['log_type']): AttendanceLog['type'] {
  const normalized = String(value ?? '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
  if (['1', 'in', 'login', 'log_in', 'check_in', 'time_in'].includes(normalized)) return 'login'
  if (['0', '2', 'out', 'logout', 'log_out', 'check_out', 'time_out'].includes(normalized)) return 'logout'
  return 'activity'
}

function mapAttendanceLog(row: AttendanceLogRow): AttendanceLog | null {
  const occurredAt = row.date_time ?? row.created_at
  if (!occurredAt) return null
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    sessionId: row.session_id === null ? undefined : String(row.session_id),
    occurredAt,
    type: getLogType(row.log_type),
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  }).format(date)
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === '42P01' || error.code === 'PGRST205' || error.message?.toLowerCase().includes('could not find the table')
}

export function AttendanceLogHistoryPage() {
  const { user, isDemoMode } = useAuth()
  const { events, history, sessions } = useEventData()
  const [logs, setLogs] = useState<AttendanceLog[]>(isDemoMode ? demoAttendanceLogs : [])
  const [isLoading, setIsLoading] = useState(!isDemoMode)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode) {
      setLogs(demoAttendanceLogs)
      setIsLoading(false)
      return
    }
    if (!supabase || !user) return
    const client = supabase

    let isMounted = true
    const loadLogs = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      const selectColumns = 'id,event_id,session_id,date_time,created_at,log_type'
      let result = await client
        .from('nu_attendees_log')
        .select(selectColumns)
        .eq('user_id', user.id)
        .order('date_time', { ascending: false })

      if (isMissingTableError(result.error)) {
        result = await client
          .from('nu_event_attendees_log')
          .select(selectColumns)
          .eq('user_id', user.id)
          .order('date_time', { ascending: false })
      }

      if (!isMounted) return
      if (result.error) {
        setLogs([])
        setErrorMessage(result.error.message)
      } else {
        const mappedLogs = ((result.data ?? []) as AttendanceLogRow[])
          .map(mapAttendanceLog)
          .filter((log): log is AttendanceLog => log !== null)
          .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
        setLogs(mappedLogs)
      }
      setIsLoading(false)
    }

    void loadLogs()
    return () => {
      isMounted = false
    }
  }, [isDemoMode, user])

  const eventNames = useMemo(
    () => new Map([...events, ...history].map((event) => [event.id, event.title])),
    [events, history],
  )
  const sessionNames = useMemo(() => new Map(sessions.map((session) => [session.id, session.title])), [sessions])
  const loginCount = logs.filter((log) => log.type === 'login').length
  const logoutCount = logs.filter((log) => log.type === 'logout').length

  return (
    <div>
      <PageHeader
        eyebrow="ATTENDANCE AUDIT"
        title="Login & Logout History"
        description="Your event attendance time-in and time-out activity from the NU attendance log."
        action={<Link className="button button--outline" to="/history"><ArrowLeft size={17} /> My attended events</Link>}
      />

      <div className="history-stats attendance-log-stats">
        <div><span><History size={20} /></span><strong>{logs.length}</strong><small>Total activity</small></div>
        <div><span><LogIn size={20} /></span><strong>{loginCount}</strong><small>Logins</small></div>
        <div><span><LogOut size={20} /></span><strong>{logoutCount}</strong><small>Logouts</small></div>
      </div>

      {errorMessage && <div className="page-notice page-notice--error" role="alert">Unable to load attendance history: {errorMessage}</div>}

      <section className="history-panel attendance-log-panel">
        <div className="section-heading"><div><h2>Attendance activity</h2><p>Most recent login or logout appears first.</p></div></div>
        {isLoading ? (
          <div className="empty-state attendance-log-empty"><Clock3 size={38} /><h3>Loading attendance history</h3><p>Retrieving your event activity from Supabase.</p></div>
        ) : logs.length ? (
          <div className="attendance-log-list">
            {logs.map((log) => {
              const isLogin = log.type === 'login'
              const label = isLogin ? 'Login' : log.type === 'logout' ? 'Logout' : 'Activity'
              return (
                <article className="attendance-log-row" key={log.id}>
                  <span className={`attendance-log-row__icon attendance-log-row__icon--${log.type}`}>
                    {isLogin ? <LogIn size={19} /> : <LogOut size={19} />}
                  </span>
                  <div className="attendance-log-row__main">
                    <span>{label}</span>
                    <strong>{eventNames.get(log.eventId) ?? `Event #${log.eventId}`}</strong>
                    {log.sessionId && <small>Session: {sessionNames.get(log.sessionId) ?? `#${log.sessionId}`}</small>}
                  </div>
                  <div className="attendance-log-row__date"><CalendarDays size={15} /> {formatDateTime(log.occurredAt)}</div>
                  <span className={`status attendance-log-row__status attendance-log-row__status--${log.type}`}>{label}</span>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state attendance-log-empty"><History size={38} /><h3>No attendance activity yet</h3><p>Event logins and logouts recorded for your account will appear here.</p></div>
        )}
      </section>
    </div>
  )
}
