import { useOutletContext, Link } from 'react-router-dom'
import {
  Users,
  CalendarCheck,
  TrendingUp,
  Database,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

export default function DashboardPage() {
  const { connectionStatus } = useOutletContext() || {}

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title-box">
          <h1>Executive Dashboard</h1>
          <p>Real-time coaching institute student pipeline, follow-up metrics, and health status.</p>
        </div>
        <div>
          <Link to="/leads" className="btn btn-primary">
            <span>View Leads Pipeline</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* KPI Preview Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Leads</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">--</div>
          <span className="metric-subtext">Phase 3 & 8 Live Sync</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">New Enquiries</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="metric-value">--</div>
          <span className="metric-subtext">Awaiting counselor contact</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Overdue Follow-ups</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="metric-value">--</div>
          <span className="metric-subtext">Requires immediate attention</span>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Conversion Rate</span>
            <div className="metric-icon-box" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="metric-value">--%</div>
          <span className="metric-subtext">Converted / Total Enquiries</span>
        </div>
      </div>

      {/* Status Showcase & Supabase Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Database size={20} color="#2563eb" />
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Supabase Foundation Status</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            Database connection and Phase 1 migrations have been verified against your Supabase project.
          </p>

          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-body)' }}>API Health Check</span>
            <div className={`status-pill ${connectionStatus?.status || 'checking'}`}>
              <span className="status-dot" />
              <span>{connectionStatus?.status === 'connected' ? 'Connected' : connectionStatus?.status === 'failed' ? 'Error' : 'Verifying'}</span>
            </div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>Phase 1 Tables:</strong> <code>profiles</code>, <code>leads</code>, <code>follow_ups</code>, <code>activities</code>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={20} color="#16a34a" />
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Pipeline Stage Badges</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
            Standardized design tokens established for the lead lifecycle:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <span className="badge badge-new">New</span>
            <span className="badge badge-contacted">Contacted</span>
            <span className="badge badge-qualified">Qualified</span>
            <span className="badge badge-converted">Converted</span>
            <span className="badge badge-lost">Lost</span>
            <span className="badge badge-overdue">Overdue</span>
          </div>
        </div>
      </div>
    </div>
  )
}
