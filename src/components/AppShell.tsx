import { useState } from 'react'
import {
  Award,
  Bell,
  CalendarCheck2,
  CalendarClock,
  ChevronRight,
  Clock3,
  History,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getUserRoleLabel } from '../lib/userRoles'
import { Brand } from './Brand'

const primaryNavigation = [
  { label: 'Dashboard', to: '/', icon: Home },
  { label: 'New Events', to: '/events/new', icon: Sparkles },
  { label: 'My Upcoming Events', to: '/events/upcoming', icon: CalendarClock },
  { label: 'My Registered Events', to: '/events/registered', icon: CalendarCheck2 },
  { label: 'Calendar View', to: '/calendar', icon: CalendarClock },
  { label: 'My Certificates', to: '/certificates', icon: Award },
  { label: 'My Attended Events', to: '/history', icon: History },
  { label: 'My Profile', to: '/profile', icon: UserRound },
  { label: 'Settings', to: '/settings', icon: Settings },
]

const mobileNavigation = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Discover', to: '/events/new', icon: Search },
  { label: 'Calendar', to: '/calendar', icon: CalendarClock },
  { label: 'Certificates', to: '/certificates', icon: Award },
]

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function AppShell() {
  const { user, signOut, isDemoMode } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const roleLabel = getUserRoleLabel(user?.role)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><Brand light /></div>
        <nav className="sidebar__nav" aria-label="Main navigation">
          <span className="sidebar__label">YOUR EVENT HUB</span>
          {primaryNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <item.icon size={19} />
              <span>{item.label}</span>
              <ChevronRight className="sidebar__chevron" size={16} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__profile">
          <div className="avatar">{initials(user?.fullName ?? 'NU')}</div>
          <div>
            <strong>{user?.fullName}</strong>
            <span>{user?.studentNumber ?? user?.email}</span>
          </div>
          <button type="button" aria-label="Sign out" onClick={handleSignOut}><LogOut size={17} /></button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="topbar__menu" type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
            <Menu size={23} />
          </button>
          <div className="topbar__mobile-brand"><Brand compact /></div>
          <div className="topbar__context">
            <span><Clock3 size={14} /> {roleLabel} event portal</span>
            {isDemoMode && <span className="demo-pill">Preview mode</span>}
          </div>
          <div className="topbar__actions">
            <button type="button" aria-label="Toggle dark and light mode" className="icon-button" onClick={toggleTheme}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button type="button" aria-label="Notifications" className="icon-button has-notification"><Bell size={20} /></button>
            <div className="topbar__profile">
              <div className="avatar avatar--small">{initials(user?.fullName ?? 'NU')}</div>
              <div><strong>{user?.fullName}</strong><span>{roleLabel}</span></div>
            </div>
          </div>
        </header>

        <main className="page-content" key={location.pathname}>
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Mobile navigation">
          {mobileNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <item.icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button type="button" onClick={() => setDrawerOpen(true)}>
            <UserRound size={21} />
            <span>More</span>
          </button>
        </nav>
      </div>

      {drawerOpen && <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
      <aside className={`mobile-drawer ${drawerOpen ? 'is-open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="mobile-drawer__header">
          <Brand />
          <button className="icon-button" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu"><X size={21} /></button>
        </div>
        <div className="mobile-drawer__profile">
          <div className="avatar">{initials(user?.fullName ?? 'NU')}</div>
          <div><strong>{user?.fullName}</strong><span>{roleLabel} · {user?.email}</span></div>
        </div>
        <nav aria-label="Expanded mobile navigation">
          {primaryNavigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setDrawerOpen(false)}>
              <item.icon size={19} /><span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="button button--ghost mobile-drawer__signout" type="button" onClick={handleSignOut}>
          <LogOut size={18} /> Sign out
        </button>
      </aside>
    </div>
  )
}
