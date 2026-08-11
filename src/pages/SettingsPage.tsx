import { Bell, Database, Download, Moon, Shield, Sun } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { PwaInstallAction } from '../components/PwaInstallAction'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { nuTableColumns } from '../lib/nuCrud'

export function SettingsPage() {
  const { isDemoMode } = useAuth()
  const { isDark, theme, toggleTheme } = useTheme()
  const tableCount = Object.keys(nuTableColumns).length
  const fieldCount = Object.values(nuTableColumns).reduce((total, columns) => total + columns.length, 0)

  return (
    <div>
      <PageHeader eyebrow="PREFERENCES" title="Settings" description="Control your app display and confirm backend readiness." />
      <div className="settings-grid">
        <section className="settings-panel">
          <div className="settings-row">
            <span className="settings-row__icon">{isDark ? <Moon size={21} /> : <Sun size={21} />}</span>
            <div><strong>Appearance</strong><small>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</small></div>
            <button className={`theme-switch ${isDark ? 'is-on' : ''}`} type="button" onClick={toggleTheme} aria-label="Toggle dark and light mode">
              <span>{isDark ? <Moon size={14} /> : <Sun size={14} />}</span>
            </button>
          </div>
          <div className="settings-row">
            <span className="settings-row__icon"><Bell size={21} /></span>
            <div><strong>Event Notifications</strong><small>Registration and certificate alerts</small></div>
            <span className="status status--open">Ready</span>
          </div>
          <div className="settings-row">
            <span className="settings-row__icon"><Shield size={21} /></span>
            <div><strong>Account Security</strong><small>{isDemoMode ? 'Connect Supabase auth for production' : 'Supabase auth connected'}</small></div>
            <span className={`status ${isDemoMode ? 'status--missed' : 'status--attended'}`}>{isDemoMode ? 'Preview' : 'Live'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-row__icon"><Download size={21} /></span>
            <div><strong>Install QMO Events</strong><small>Save the app to your home screen for quick access</small></div>
            <PwaInstallAction placement="settings" />
          </div>
        </section>

        <section className="settings-panel settings-panel--schema">
          <div className="section-heading"><div><h2>Backend Schema</h2><p>CSV table names and fields exposed to the CRUD service.</p></div></div>
          <div className="schema-summary"><Database size={23} /><strong>{tableCount} tables</strong><span>{fieldCount} columns</span></div>
          <div className="schema-list">
            {Object.entries(nuTableColumns).map(([table, columns]) => (
              <details key={table}>
                <summary><span>{table}</span><small>{columns.length} fields</small></summary>
                <p>{columns.join(', ')}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
