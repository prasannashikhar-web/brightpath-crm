import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react'

export default function RoleGuard({ allowedRoles = ['admin', 'manager'], children }) {
  const { role, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-box">
          <Loader2 size={36} className="spin" color="var(--color-accent-blue)" />
          <span className="auth-loading-text">Verifying role permissions...</span>
        </div>
      </div>
    )
  }

  const isAuthorized = allowedRoles.includes(role)

  if (!isAuthorized) {
    return (
      <div className="card" style={{ maxWidth: '540px', margin: '40px auto', textAlign: 'center', padding: '36px 28px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--alert-danger-bg)',
            color: 'var(--alert-danger-text)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          Role Authorization Required
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
          This view is restricted to <strong>{allowedRoles.join(' or ')}</strong> roles. Your current profile
          ({profile?.full_name || 'Staff Member'}) is assigned as <strong>{role}</strong>.
        </p>
        <div>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px' }}>
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  return children ? children : <Outlet />
}
