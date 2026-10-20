import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  Menu,
  X,
  GraduationCap,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { checkSupabaseConnection } from '../../lib/supabaseClient'
import { useAuth } from '../../context/useAuth'

export default function AppLayout() {
  const location = useLocation()
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'checking',
    message: 'Testing Supabase connection...'
  })

  const { user, profile, role, signOut, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  // Test Supabase connection on mount
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Close mobile drawer on route change (in-render state adjustment per React guidelines)
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false)
    }
  }

  // Close mobile drawer and dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileDrawerOpen(false)
        setUserDropdownOpen(false)
      }
    }
    if (mobileDrawerOpen || userDropdownOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileDrawerOpen, userDropdownOpen])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [mobileDrawerOpen])

  const closeDrawer = () => setMobileDrawerOpen(false)

  const handleSignOut = async () => {
    try {
      setUserDropdownOpen(false)
      closeDrawer()
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Executive Dashboard'
    if (path.startsWith('/leads/') && path !== '/leads') return 'Lead Details'
    if (path === '/leads') return 'Leads Pipeline'
    if (path === '/follow-ups') return 'Follow-Up Management'
    if (path === '/reports') return 'Reports & Analytics'
    if (path === '/login') return 'Staff Authentication'
    return 'BrightPath CRM'
  }

  // Derive initials from full name or email
  const getInitials = () => {
    const name = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Staff'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Staff Member'

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

      {!isAuthenticated && (
        <>
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
      )}
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
            <span className="brand-subtitle">Coaching & Client Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {renderNavLinks()}
        </nav>

        {/* Authenticated User in Sidebar Footer */}
        {isAuthenticated && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div className="user-avatar-sm" style={{ backgroundColor: 'var(--color-accent-blue)', flexShrink: 0 }}>
                  {getInitials()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {displayName}
                  </span>
                  <span className={`role-badge role-badge-${role}`} style={{ width: 'fit-content', marginTop: '2px' }}>
                    {role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign out"
                aria-label="Sign out"
                style={{ color: '#94a3b8', padding: '6px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

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
          role="presentation"
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

            {isAuthenticated && (
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="user-avatar-sm" style={{ backgroundColor: 'var(--color-accent-blue)' }}>
                      {getInitials()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>{displayName}</div>
                      <span className={`role-badge role-badge-${role}`}>{role}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '12px', padding: '6px 12px', justifyContent: 'center', gap: '6px' }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

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
              aria-expanded={mobileDrawerOpen}
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

            {/* Authenticated User Pill with Dropdown */}
            {isAuthenticated ? (
              <div className="user-dropdown-container" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-pill-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="user-avatar-sm">
                    {getInitials()}
                  </div>
                  <span className="user-pill-name">{displayName}</span>
                  <span className={`role-badge role-badge-${role}`}>{role}</span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="user-dropdown-menu" role="menu">
                    <div className="dropdown-user-header">
                      <div className="dropdown-user-name">{displayName}</div>
                      <div className="dropdown-user-email">{user?.email}</div>
                      <div style={{ marginTop: '6px' }}>
                        <span className={`role-badge role-badge-${role}`}>{role}</span>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item danger"
                      onClick={handleSignOut}
                      role="menuitem"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                <LogIn size={15} />
                <span>Staff Sign In</span>
              </Link>
            )}
          </div>
        </header>

        <main className="page-container">
          <Outlet context={{ connectionStatus }} />
        </main>
      </div>
    </div>
  )
}
