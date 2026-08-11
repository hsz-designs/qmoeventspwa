import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Brand } from './components/Brand'
import { PwaInstallPromotion } from './components/PwaInstallPromotion'
import { CalendarPage } from './pages/CalendarPage'
import { useAuth } from './context/AuthContext'
import { CertificatesPage } from './pages/CertificatesPage'
import { DashboardPage } from './pages/DashboardPage'
import { EventScannerPage } from './pages/EventScannerPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { NewEventsPage } from './pages/NewEventsPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisteredEventsPage } from './pages/RegisteredEventsPage'
import { RegistrationDetailsPage } from './pages/RegistrationDetailsPage'
import { ScannedEventRegistrationPage } from './pages/ScannedEventRegistrationPage'
import { SettingsPage } from './pages/SettingsPage'
import { UpcomingEventsPage } from './pages/UpcomingEventsPage'
import { AttendanceLogHistoryPage } from './pages/AttendanceLogHistoryPage'

function ProtectedLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="app-loader">
        <Brand />
        <span className="app-loader__bar"><i /></span>
        <p>Preparing your event hub…</p>
      </div>
    )
  }

  return user ? <AppShell /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="events/new" element={<NewEventsPage />} />
          <Route path="events/upcoming" element={<UpcomingEventsPage />} />
          <Route path="events/registered" element={<RegisteredEventsPage />} />
          <Route path="events/registered/:eventId" element={<RegistrationDetailsPage />} />
          <Route path="events/scan" element={<EventScannerPage />} />
          <Route path="events/scan/register" element={<ScannedEventRegistrationPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/login-logout" element={<AttendanceLogHistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PwaInstallPromotion />
    </>
  )
}
