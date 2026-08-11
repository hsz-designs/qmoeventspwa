import { Award, CalendarCheck2, Mail, QrCode, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { QrCodeImage } from '../components/QrCodeImage'
import { useAuth } from '../context/AuthContext'
import { useEventData } from '../context/EventContext'
import { getUserRoleLabel } from '../lib/userRoles'

function formatName(name?: string) {
  return name?.trim() || 'NU User'
}

export function ProfilePage() {
  const { user, isDemoMode } = useAuth()
  const { certificates, history, registeredIds } = useEventData()
  const attended = history.filter((event) => event.status === 'attended' || event.status === 'completed').length
  const userQrCode = user?.userQrCode ?? (isDemoMode ? user?.studentNumber : undefined)
  const roleLabel = getUserRoleLabel(user?.role)

  return (
    <div>
      <PageHeader eyebrow="ACCOUNT" title="My Profile" description="Your QMO event identity and participation summary." />
      <section className="profile-hero">
        <div className="profile-hero__avatar"><UserRound size={42} /></div>
        <div>
          <span>{isDemoMode ? 'Preview profile' : 'Supabase profile'}</span>
          <h1>{formatName(user?.fullName)}</h1>
          <p>{user?.program ?? 'National University Manila'}</p>
        </div>
        {userQrCode ? (
          <QrCodeImage
            className="profile-hero__qr"
            value={userQrCode}
            label={`${formatName(user?.fullName)} user QR code`}
            title={formatName(user?.fullName)}
            subtitle={user?.email ?? 'NU event participant'}
            badge="Personal attendance QR"
            filename={`QMO-${formatName(user?.fullName)}-profile-QR-card`}
            variant="profile"
          />
        ) : (
          <div className="profile-hero__qr-empty"><QrCode size={30} /><span>QR code unavailable</span></div>
        )}
      </section>

      <div className="profile-grid">
        <section className="profile-panel">
          <div className="section-heading"><div><h2>Profile Details</h2><p>Your account details from the NU user record.</p></div></div>
          <dl className="detail-list">
            <div><dt>Email</dt><dd><Mail size={15} />{user?.email ?? 'Not available'}</dd></div>
            <div><dt>User ID</dt><dd><QrCode size={15} />{user?.studentNumber ?? user?.id ?? 'Not available'}</dd></div>
            <div><dt>Program</dt><dd>{user?.program ?? 'Not set'}</dd></div>
            <div><dt>Role</dt><dd>{roleLabel}</dd></div>
          </dl>
        </section>

        <section className="profile-panel">
          <div className="section-heading"><div><h2>Participation</h2><p>Counts update from registrations and attendance logs.</p></div></div>
          <div className="profile-stats">
            <div><span><CalendarCheck2 size={20} /></span><strong>{registeredIds.size}</strong><small>Registered</small></div>
            <div><span><ShieldCheck size={20} /></span><strong>{attended}</strong><small>Attended</small></div>
            <div><span><Award size={20} /></span><strong>{certificates.length}</strong><small>Certificates</small></div>
          </div>
        </section>
      </div>
    </div>
  )
}
