import { PieChart, TrendingUp, Users } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div>
      <div className="page-header">
        <div className="page-header-title-box">
          <h1>Reports & Pipeline Analytics</h1>
          <p>Admissions funnel analysis, counsellor workload distribution, and channel conversion rates.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <TrendingUp size={20} color="var(--color-accent-blue)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Conversion Funnel (Phase 9)</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Stage-by-stage progression rate from <em>New</em> to <em>Converted</em> admissions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                <span>1. New Inquiries</span>
                <span>100%</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-accent-blue)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                <span>2. Contacted</span>
                <span>--%</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                <div style={{ width: '70%', height: '100%', backgroundColor: '#7e22ce' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                <span>3. Qualified</span>
                <span>--%</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', backgroundColor: '#b45309' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                <span>4. Converted Admissions</span>
                <span>--%</span>
              </div>
              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface-subtle)', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', backgroundColor: '#047857' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <PieChart size={20} color="#7e22ce" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Lead Source Breakdown</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Effectiveness and conversion rates across student acquisition channels.
          </p>
          <div className="placeholder-banner">
            <span className="placeholder-badge">Ready for Phase 9</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Source distribution (Website, Walk-in, Google Ads, Referrals) will be populated dynamically.
            </span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Users size={20} color="#047857" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Counsellor Workload Distribution</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Team lead distribution and follow-up pending load per team member.
          </p>
          <div className="placeholder-banner">
            <span className="placeholder-badge">Ready for Phase 9</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Role-scoped view: Counsellors see personal metrics; Managers/Admins see team workload.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
