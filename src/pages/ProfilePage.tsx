import { useState, type FormEvent } from 'react'
import { Award, CalendarCheck2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, QrCode, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { QrCodeImage } from '../components/QrCodeImage'
import { useAuth } from '../context/AuthContext'
import { useEventData } from '../context/EventContext'
import { getUserRoleLabel } from '../lib/userRoles'

function formatName(name?: string) {
  return name?.trim() || 'NU User'
}

export function ProfilePage() {
  const { user, isDemoMode, updatePassword } = useAuth()
  const { certificates, history, registeredIds } = useEventData()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePassword, setVisiblePassword] = useState<'current' | 'new' | 'confirm' | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const attended = history.filter((event) => event.status === 'attended' || event.status === 'completed').length
  const userQrCode = user?.userQrCode ?? (isDemoMode ? user?.studentNumber : undefined)
  const roleLabel = getUserRoleLabel(user?.role)

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Your new password must contain at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'The new password and confirmation do not match.' })
      return
    }
    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'Choose a new password that is different from your current password.' })
      return
    }

    setIsUpdatingPassword(true)
    try {
      await updatePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setVisiblePassword(null)
      setPasswordMessage({ type: 'success', text: 'Your password has been changed successfully.' })
    } catch (error) {
      setPasswordMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to change your password. Please try again.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setVisiblePassword((visible) => visible === field ? null : field)
  }

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

        <section className="profile-panel profile-panel--security" id="password">
          <div className="section-heading">
            <div><h2>Change Password</h2><p>Confirm your current password before setting a new one.</p></div>
            <span className="profile-security__icon"><KeyRound size={20} /></span>
          </div>

          {isDemoMode ? (
            <div className="preview-notice profile-security__notice">
              <span>Preview</span>
              Connect Supabase authentication to change your account password.
            </div>
          ) : null}

          <form className="password-form" onSubmit={handlePasswordChange}>
            <div className="password-form__fields">
              <label>
                <span>Current password</span>
                <div className="input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={visiblePassword === 'current' ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    disabled={isDemoMode || isUpdatingPassword}
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('current')} aria-label={visiblePassword === 'current' ? 'Hide current password' : 'Show current password'} disabled={isDemoMode || isUpdatingPassword}>
                    {visiblePassword === 'current' ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label>
                <span>New password</span>
                <div className="input-wrap">
                  <KeyRound size={18} />
                  <input
                    type={visiblePassword === 'new' ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    disabled={isDemoMode || isUpdatingPassword}
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('new')} aria-label={visiblePassword === 'new' ? 'Hide new password' : 'Show new password'} disabled={isDemoMode || isUpdatingPassword}>
                    {visiblePassword === 'new' ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label>
                <span>Confirm new password</span>
                <div className="input-wrap">
                  <KeyRound size={18} />
                  <input
                    type={visiblePassword === 'confirm' ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    minLength={6}
                    disabled={isDemoMode || isUpdatingPassword}
                    required
                  />
                  <button type="button" onClick={() => togglePasswordVisibility('confirm')} aria-label={visiblePassword === 'confirm' ? 'Hide password confirmation' : 'Show password confirmation'} disabled={isDemoMode || isUpdatingPassword}>
                    {visiblePassword === 'confirm' ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            {passwordMessage ? (
              <div className={`form-message form-message--${passwordMessage.type} password-form__message`} role={passwordMessage.type === 'error' ? 'alert' : 'status'}>
                {passwordMessage.text}
              </div>
            ) : null}

            <div className="password-form__actions">
              <small>Your password is updated directly in your Supabase Auth account.</small>
              <button className="button button--primary" type="submit" disabled={isDemoMode || isUpdatingPassword}>
                <ShieldCheck size={17} /> {isUpdatingPassword ? 'Changing password…' : 'Change password'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
