import { Calendar, Clock, AlertTriangle, CheckCircle2, Plus } from 'lucide-react'

export default function FollowUpsPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-title-box">
          <h1>Follow-Up Management Engine</h1>
          <p>Track urgent callbacks, scheduled counselling sessions, and overdue interactions.</p>
        </div>
        <div>
          <button type="button" className="btn btn-primary" title="Enabled in Phase 6">
            <Plus size={16} />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface-subtle)' }}>
          <button
            type="button"
            style={{
              padding: '14px 20px',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--alert-danger-text)',
              borderBottom: '2px solid var(--alert-danger-text)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} />
            <span>Overdue Follow-ups</span>
            <span className="badge badge-overdue" style={{ fontSize: '11px', padding: '1px 6px' }}>0</span>
          </button>

          <button
            type="button"
            style={{
              padding: '14px 20px',
              fontWeight: 500,
              fontSize: '14px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Clock size={16} />
            <span>Upcoming / Today</span>
          </button>

          <button
            type="button"
            style={{
              padding: '14px 20px',
              fontWeight: 500,
              fontSize: '14px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} />
            <span>Completed</span>
          </button>
        </div>

        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              marginBottom: '12px'
            }}
          >
            <Calendar size={24} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
            Follow-Up Engine Shell Initialized
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            Phase 6 will connect this view to Supabase <code>follow_ups</code> with the exact rule:
            Overdue only when <code>status = 'pending'</code> AND <code>due_at &lt; now()</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
