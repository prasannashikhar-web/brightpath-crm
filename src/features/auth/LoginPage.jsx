import { useState } from 'react'
import { GraduationCap, Lock, Mail, User, Shield } from 'lucide-react'

export default function LoginPage() {
  const [tab, setTab] = useState('signin')

  return (
    <div style={{ maxWidth: '440px', margin: '40px auto' }}>
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="brand-icon-box"
            style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px' }}
          >
            <GraduationCap size={26} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
            BrightPath CRM
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Institute Staff & Counsellor Portal
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            onClick={() => setTab('signin')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: tab === 'signin' ? 'var(--bg-surface)' : 'transparent',
              color: tab === 'signin' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: tab === 'signin' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: tab === 'signup' ? 'var(--bg-surface)' : 'transparent',
              color: tab === 'signup' ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: tab === 'signup' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Placeholder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tab === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '4px' }}>
                Full Name
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                <User size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  disabled
                  style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '4px' }}>
              Work Email
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
              <Mail size={16} color="var(--text-muted)" />
              <input
                type="email"
                placeholder="counsellor@brightpath.edu"
                disabled
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '4px' }}>
              Password
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                placeholder="••••••••"
                disabled
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
              />
            </div>
          </div>

          <div className="placeholder-banner" style={{ padding: '16px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent-blue)', fontSize: '13px', fontWeight: 600 }}>
              <Shield size={16} />
              <span>Phase 2 Milestone</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Full Supabase authentication, session persistence, and role guards (Admin, Manager, Counsellor) will be activated in Phase 2.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
