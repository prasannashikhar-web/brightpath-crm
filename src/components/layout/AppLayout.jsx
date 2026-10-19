import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Menu,
  X,
  GraduationCap,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { checkSupabaseConnection } from '../../lib/supabaseClient'

export default function AppLayout() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'checking',
    message: 'Testing Supabase connection...'
  })
  const location = useLocation()

  // Run Supabase health check on mount to preserve existing Phase 1 connectivity verification
  useEffect(() => {
    let isMounted = true

    checkSupabaseConnection().then((res) => {
      if (!isMounted) return
      if (res.connected) {
        setConnectionStatus({ status: 'connected', message: res.message })
      } else {
        setConnectionStatus({ status: 'failed', message: res.message })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const closeDrawer = () => setMobileDrawerOpen(false)

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Executive Dashboard'
    if (path.startsWith('/leads/') && path !== '/leads') return 'Lead Details'
    if (path === '/leads') return 'Leads Pipeline'
    if (path === '/follow-ups') return 'Follow-Up Management'
    if (path === '/reports') return 'Reports & Analytics'
    if (path === '/login') return 'Authentication'
    return 'BrightPath CRM'
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads Pipeline', path: '/leads', icon: Users },
    { label: 'Follow-ups', path: '/follow-ups', icon: CalendarCheck },
    { label: 'Reports', path: '/reports', icon: BarChart3 }
  ]

  const renderNavLinks = (onSelect) => (
    <>
      <div className="nav-section-label">Main Menu</div>
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onSelect}
            className={({ isActive }) =>
              `nav-link-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="nav-link-icon" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}

      <div className="nav-section-label" style={{ marginTop: '16px' }}>Account & Auth</div>
      <NavLink
        to="/login"
        onClick={onSelect}
        className={({ isActive }) =>
          `nav-link-item ${isActive ? 'active' : ''}`
        }
      >
        <LogIn className="nav-link-icon" />
        <span>Sign In / Register</span>
      </NavLink>
    </>
  )

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar" aria-label="Main Navigation">
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <GraduationCap size={22} />
          </div>
          <div className="brand-info">
            <span className="brand-title">BrightPath CRM</span>
            <span className="brand-subtitle">Coaching Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {renderNavLinks()}
        </nav>

        <div className="sidebar-footer">
          <div className={`status-pill ${connectionStatus.status}`}>
            <span className="status-dot" />
            <span className="status-text">
              {connectionStatus.status === 'connected' && 'Supabase Live'}
              {connectionStatus.status === 'failed' && 'Supabase Offline'}
              {connectionStatus.status === 'checking' && 'Checking DB...'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        >
          <div
            className="mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="brand-icon-box" style={{ width: '32px', height: '32px' }}>
                  <GraduationCap size={18} />
                </div>
                <span className="brand-title" style={{ fontSize: '16px' }}>BrightPath</span>
              </div>
              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {renderNavLinks(closeDrawer)}
            </nav>

            <div className="sidebar-footer">
              <div className={`status-pill ${connectionStatus.status}`}>
                <span className="status-dot" />
                <span>
                  {connectionStatus.status === 'connected' && 'Supabase Live'}
                  {connectionStatus.status === 'failed' && 'Supabase Offline'}
                  {connectionStatus.status === 'checking' && 'Checking DB...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="app-main">
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="header-page-title">{getPageTitle()}</h1>
          </div>

          <div className="header-right">
            {/* Supabase status indicator */}
            <div
              className={`status-pill ${connectionStatus.status}`}
              title={connectionStatus.message}
            >
              {connectionStatus.status === 'connected' && <CheckCircle2 size={14} />}
              {connectionStatus.status === 'failed' && <AlertCircle size={14} />}
              {connectionStatus.status === 'checking' && <Loader2 size={14} className="spin" />}
              <span className="status-text">
                {connectionStatus.status === 'connected' && 'Supabase API Connected'}
                {connectionStatus.status === 'failed' && 'Supabase Disconnected'}
                {connectionStatus.status === 'checking' && 'Connecting...'}
              </span>
            </div>

            {/* User pill placeholder (ready for Phase 2 Auth) */}
            <div className="user-pill" title="Authentication lifecycle ready for Phase 2">
              <div className="user-avatar-sm">BP</div>
              <span>Staff Portal</span>
            </div>
          </div>
        </header>

        <main className="page-container">
          <Outlet context={{ connectionStatus }} />
        </main>
      </div>
    </div>
  )
}
